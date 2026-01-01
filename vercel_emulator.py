import http.server
import socketserver
import os
import sys
import importlib.util
from urllib.parse import urlparse
from io import BytesIO
import traceback
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

PORT = 3000

class ThreadingSimpleServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

class VercelEmulator(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.route_request('GET')

    def do_POST(self):
        self.route_request('POST')

    def do_OPTIONS(self):
        self.route_request('OPTIONS')
    
    def log_message(self, format, *args):
        # Silence default logs
        return

    def route_request(self, method):
        if self.path.startswith('/api/'):
            parsed_path = urlparse(self.path)
            clean_path = parsed_path.path.strip('/')
            
            script_path = f"{clean_path}.py"
            module_name = clean_path.replace('/', '.')

            if os.path.exists(script_path):
                print(f"[{method}] Processing {script_path}...")
                try:
                    spec = importlib.util.spec_from_file_location(module_name, script_path)
                    module = importlib.util.module_from_spec(spec)
                    sys.modules[module_name] = module
                    spec.loader.exec_module(module)

                    if hasattr(module, 'handler'):
                        # Read Body Once
                        content_len = int(self.headers.get('Content-Length', 0))
                        body_bytes = self.rfile.read(content_len)

                        # Bridge
                        class BridgeHandler(module.handler):
                            def __init__(self, emulator, data):
                                # Map all attributes BaseHTTPRequestHandler expects
                                self.client_address = emulator.client_address
                                self.server = emulator.server
                                self.command = emulator.command
                                self.path = emulator.path
                                self.request_version = emulator.request_version
                                self.headers = emulator.headers
                                
                                # FIX: Define requestline for logging
                                self.requestline = f"{self.command} {self.path} {self.request_version}"
                                
                                # Set Input/Output
                                self.rfile = BytesIO(data)
                                self.wfile = emulator.wfile

                                # Execute immediately
                                try:
                                    if self.command == 'GET':
                                        self.do_GET()
                                    elif self.command == 'POST':
                                        self.do_POST()
                                    elif self.command == 'OPTIONS':
                                        self.do_OPTIONS()
                                except Exception:
                                    traceback.print_exc() # Print full error details

                        BridgeHandler(self, body_bytes)
                        print(f"[{method}] Finished {script_path}")
                        return
                    else:
                        self.send_error(500, f"File {script_path} missing class 'handler'")
                        return
                except Exception as e:
                    print(f"Error loading {script_path}: {e}")
                    traceback.print_exc()
                    self.send_error(500, f"Script error: {str(e)}")
                    return
            else:
                self.send_error(404, f"API Endpoint not found: {script_path}")
                return

        # Serve Static Files
        if method == 'GET':
            super().do_GET()
        else:
            self.send_error(405, "Method Not Allowed")

print(f"-------------------------------------------------------")
print(f" Vercel Emulator (Final) Running on http://localhost:{PORT}")
print(f"-------------------------------------------------------")

with ThreadingSimpleServer(("", PORT), VercelEmulator) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
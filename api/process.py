from http.server import BaseHTTPRequestHandler
import json
from api.utils import parse_data

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length'))
        body = json.loads(self.rfile.read(length))
        result = parse_data(body['content'])

        self.send_response(200)
        self.send_header('Content-Type','application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

from http.server import BaseHTTPRequestHandler
import json
import traceback

class handler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        try:
            # Import plotly here (lazy import for faster cold starts)
            import plotly.graph_objects as go
            import plotly.io as pio
            
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            plot_data = json.loads(post_data.decode('utf-8'))
            
            if not plot_data or 'data' not in plot_data or 'layout' not in plot_data:
                raise ValueError('Invalid plot data format')
            
            # Create plotly figure from JSON
            fig = go.Figure(data=plot_data['data'], layout=plot_data['layout'])
            
            # Export to PNG using kaleido
            img_bytes = pio.to_image(fig, format='png', width=1200, height=600, engine='kaleido')
            
            # Send PNG image
            self.send_response(200)
            self.send_header('Content-type', 'image/png')
            self.send_header('Content-Disposition', 'attachment; filename="plot.png"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(img_bytes)
            
        except ImportError as e:
            # Library import error
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_msg = {
                'error': f'Missing library: {str(e)}. Make sure plotly and kaleido are in requirements.txt',
                'type': 'ImportError'
            }
            self.wfile.write(json.dumps(error_msg).encode())
            
        except Exception as e:
            # All other errors
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_msg = {
                'error': f'PNG export error: {str(e)}',
                'type': type(e).__name__,
                'traceback': traceback.format_exc()
            }
            self.wfile.write(json.dumps(error_msg).encode())

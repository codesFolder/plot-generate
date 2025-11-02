from http.server import BaseHTTPRequestHandler
import json
import plotly.graph_objects as go
import plotly.io as pio

class handler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            plot_data = json.loads(post_data.decode('utf-8'))
            
            fig = go.Figure(data=plot_data['data'], layout=plot_data['layout'])
            
            # Export to SVG
            svg_bytes = pio.to_image(fig, format='svg', width=1200, height=600, engine='kaleido')
            
            self.send_response(200)
            self.send_header('Content-type', 'image/svg+xml')
            self.send_header('Content-Disposition', 'attachment; filename="plot.svg"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(svg_bytes)
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

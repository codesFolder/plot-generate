from http.server import BaseHTTPRequestHandler
import json
import plotly.graph_objects as go
import plotly.io as pio
from PIL import Image
import io

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
            
            # Check if animated
            if 'frames' in plot_data and len(plot_data['frames']) > 0:
                # Generate frames
                frames = []
                for frame in plot_data['frames'][:20]:  # Limit to 20 frames
                    fig = go.Figure(data=frame['data'], layout=plot_data['layout'])
                    img_bytes = pio.to_image(fig, format='png', width=800, height=400, engine='kaleido')
                    img = Image.open(io.BytesIO(img_bytes))
                    frames.append(img)
                
                # Save as GIF
                output = io.BytesIO()
                frames[0].save(
                    output,
                    format='GIF',
                    save_all=True,
                    append_images=frames[1:],
                    duration=200,
                    loop=0
                )
                gif_bytes = output.getvalue()
            else:
                # Static plot -> single frame GIF
                fig = go.Figure(data=plot_data['data'], layout=plot_data['layout'])
                img_bytes = pio.to_image(fig, format='png', width=1200, height=600, engine='kaleido')
                img = Image.open(io.BytesIO(img_bytes))
                
                output = io.BytesIO()
                img.save(output, format='GIF')
                gif_bytes = output.getvalue()
            
            self.send_response(200)
            self.send_header('Content-type', 'image/gif')
            self.send_header('Content-Disposition', 'attachment; filename="plot.gif"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(gif_bytes)
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

from http.server import BaseHTTPRequestHandler
import json
import plotly.graph_objects as go
import plotly.io as pio
import zipfile
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
            request_data = json.loads(post_data.decode('utf-8'))
            
            plots = request_data.get('plots', [])
            data = request_data.get('data', {})
            
            # Create ZIP file in memory
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add each plot as PNG
                for idx, plot in enumerate(plots):
                    fig = go.Figure(data=plot['data'], layout=plot['layout'])
                    img_bytes = pio.to_image(fig, format='png', width=1200, height=600, engine='kaleido')
                    zip_file.writestr(f'plot_{idx + 1}.png', img_bytes)
                
                # Add data CSV
                if data.get('columns') and data.get('rows'):
                    csv_content = ','.join(data['columns']) + '\n'
                    for row in data['rows']:
                        csv_content += ','.join(str(v) for v in row) + '\n'
                    zip_file.writestr('data.csv', csv_content)
                
                # Add HTML dashboard
                html_content = generate_dashboard_html(plots)
                zip_file.writestr('dashboard.html', html_content)
            
            zip_bytes = zip_buffer.getvalue()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/zip')
            self.send_header('Content-Disposition', 'attachment; filename="dashboard.zip"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(zip_bytes)
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())


def generate_dashboard_html(plots):
    """Generate HTML with all plots"""
    plots_html = ''
    plots_js = ''
    
    for idx, plot in enumerate(plots):
        plots_html += f'<div id="plot{idx}" style="margin-bottom: 40px;"></div>\n'
        plots_js += f"Plotly.newPlot('plot{idx}', {json.dumps(plot['data'])}, {json.dumps(plot['layout'])}, {{responsive: true}});\n"
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Dashboard</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body {{ margin: 0; padding: 40px; font-family: system-ui, sans-serif; }}
        h1 {{ margin: 0 0 32px 0; }}
    </style>
</head>
<body>
    <h1>Plot Dashboard</h1>
    {plots_html}
    <script>
        {plots_js}
    </script>
</body>
</html>"""
    
    return html

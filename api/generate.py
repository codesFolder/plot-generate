from http.server import BaseHTTPRequestHandler
import json
import traceback

class handler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'ok'}).encode())
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            data = request_data.get('data', {})
            config = request_data.get('config', {})
            
            columns = data.get('columns', [])
            rows = data.get('rows', [])
            
            if not columns or not rows:
                raise ValueError('No data provided')
            
            # Extract config
            plot_type = config.get('plotType', 'line')
            x_col = config.get('xCol', 0)
            y_col = config.get('yCol', 1)
            title = config.get('title', 'Plot')
            x_label = config.get('xLabel', 'X')
            y_label = config.get('yLabel', 'Y')
            color = config.get('color', '#21808d')
            show_legend = config.get('showLegend', False)
            y_min = config.get('yMin')
            y_max = config.get('yMax')
            animated = config.get('animated', False)
            
            # Prepare data
            x_data = [row[x_col] for row in rows if len(row) > x_col]
            y_data = []
            
            for row in rows:
                if len(row) > y_col:
                    try:
                        y_data.append(float(row[y_col]))
                    except:
                        y_data.append(0)
            
            # Build plot
            plotly_data = []
            
            if plot_type == 'pie':
                plotly_data.append({
                    'type': 'pie',
                    'labels': x_data,
                    'values': y_data,
                    'marker': {'colors': [color]}
                })
                layout = {
                    'title': {'text': title, 'font': {'size': 18}},
                    'showlegend': True
                }
            elif plot_type == 'histogram':
                plotly_data.append({
                    'type': 'histogram',
                    'x': y_data,
                    'marker': {'color': color}
                })
                layout = {
                    'title': {'text': title, 'font': {'size': 18}},
                    'xaxis': {'title': x_label},
                    'yaxis': {'title': 'Frequency'},
                    'showlegend': False
                }
            else:
                trace = {
                    'x': x_data,
                    'y': y_data,
                    'type': plot_type,
                    'name': columns[y_col] if y_col < len(columns) else 'Data',
                    'marker': {'color': color} if plot_type == 'bar' else None,
                    'line': {'color': color, 'width': 2} if plot_type in ['line', 'area'] else None
                }
                
                if plot_type == 'scatter':
                    trace['mode'] = 'markers'
                    trace['marker'] = {'size': 10, 'color': color}
                elif plot_type == 'area':
                    trace['fill'] = 'tozeroy'
                
                # Animation frames for line chart
                if animated and plot_type == 'line':
                    frames = []
                    for i in range(1, len(x_data) + 1):
                        frames.append({
                            'data': [{
                                'x': x_data[:i],
                                'y': y_data[:i],
                                'type': 'line',
                                'line': {'color': color, 'width': 2}
                            }],
                            'name': str(i)
                        })
                    
                    plotly_data.append(trace)
                    layout = {
                        'title': {'text': title, 'font': {'size': 18}},
                        'xaxis': {'title': x_label, 'range': [min(range(len(x_data))), max(range(len(x_data)))]},
                        'yaxis': {'title': y_label, 'range': [min(y_data) * 0.9, max(y_data) * 1.1]},
                        'showlegend': show_legend,
                        'updatemenus': [{
                            'type': 'buttons',
                            'showactive': False,
                            'buttons': [
                                {
                                    'label': '▶ Play',
                                    'method': 'animate',
                                    'args': [None, {
                                        'frame': {'duration': 200, 'redraw': True},
                                        'fromcurrent': True,
                                        'mode': 'immediate'
                                    }]
                                },
                                {
                                    'label': '⏸ Pause',
                                    'method': 'animate',
                                    'args': [[None], {
                                        'frame': {'duration': 0, 'redraw': False},
                                        'mode': 'immediate'
                                    }]
                                }
                            ]
                        }]
                    }
                    
                    result = {
                        'data': plotly_data,
                        'layout': layout,
                        'frames': frames
                    }
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(result).encode())
                    return
                
                plotly_data.append(trace)
                
                layout = {
                    'title': {'text': title, 'font': {'size': 18}},
                    'xaxis': {'title': x_label},
                    'yaxis': {
                        'title': y_label,
                        'range': [float(y_min) if y_min else None, float(y_max) if y_max else None]
                    },
                    'showlegend': show_legend
                }
            
            result = {
                'data': plotly_data,
                'layout': layout
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e),
                'traceback': traceback.format_exc()
            }).encode())

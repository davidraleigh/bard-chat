from bottle import Bottle, run, static_file

app = Bottle()

@app.route('/static/<filename>')
def server_static(filename):
    return static_file(filename, root='./static')

run(app, host='localhost', port=8080)

from flask import Flask, render_template, jsonify
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

MUSIC_FOLDER = os.path.join(app.static_folder, 'music')

@app.route('/songs')
def songs():
    songs = [song for song in os.listdir(MUSIC_FOLDER) if song.endswith('.mp3')]
    return jsonify(songs=songs)

@app.route('/')
def player():
    return render_template('player.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

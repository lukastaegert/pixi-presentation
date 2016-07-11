
Dieses Projekt stellt das Standard-TNG-Präsentations-Template bereit.

## Start der Präsentation

Voraussetzung für das Projekt ist lediglich eine Node.js-Installation:

```
sudo apt-get install nodejs     # Linux mit Aptitude
brew install nodejs             # Mac OS X mit Brew
choco install nodejs            # Windows mit Chocolatey
```

Daraufhin kann der Server mittels folgendem Befehl gestartet werden:

```
./start.sh      # Linux, Mac OS
start.bat       # Windows
```

Nun kann im Browser zu "http://localhost:8000" navigiert werden.

## Start der Präsentation ohne Server

Ein Server ist nicht nötig, falls der Browser mit der Möglichkeit zu File Access gestartet wird:

```
chrome --allow-file-access-from-files
firefox                                 # Dateizugriff funktioniert auch ohne Parameter
```

Per Navigation zu "file://{PATH_ON_FILE_SYSTEM}" kann dann die Präsentation aufgerufen werden.

Live Editing ist in diesem Fall allerdings nicht möglich.
Falls die entsprechenden Folien aus der Präsentation entfernt werden, versucht der Browser auch nicht mehr,
eine Websocket-Verbindung aufzubauen.

## Wie entwerfe ich eine Präsentation?

Die initiale Präsentation zeigt direkt anhand von Beispielen, wie die einzelnen Plugins zu bedienen sind.
Die entsprechenden Folien können für die eigene Präsentation kopiert und abgewandelt werden.
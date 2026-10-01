from fastapi import FastAPI



app = FastAPI(title="Dear Love API")





@app.get("/")

def home():

&#x20;   return {

&#x20;       "app": "Dear Love",

&#x20;       "short\_name": "DL",

&#x20;       "message": "Welcome to Dear Love!",

&#x20;       "status": "online"

&#x20;   }





@app.get("/health")

def health():

&#x20;   return {

&#x20;       "status": "healthy"

&#x20;   }


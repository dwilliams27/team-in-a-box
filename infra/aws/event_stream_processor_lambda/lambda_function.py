import json
import os
from pymongo import MongoClient
import requests

def lambda_handler(event, context):
    print('Processing event:', json.dumps(event))

    # Testing
    response = requests.get('https://api.ipify.org')
    ip_address = response.text
    print(f"Outbound IP address: {ip_address}")

    mongo_uri = os.environ.get('MONGO_DB_URI')
    
    client = MongoClient(mongo_uri)
    print('Created mongo client')
    db = client['BoxDB']
    collection = db['event_stream']
    
    # Process SQS messages
    for record in event['Records']:
        print('inserting message:', record['body'])
        
        message = json.loads(record['body'])
        print('Message', message)
        # Insert into mongo
        collection.insert_one(message)
    
    client.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps({ 'success': True })
    }
import json
import os
from pymongo import MongoClient

def lambda_handler(event, context):
    # MongoDB Atlas connection string
    mongo_uri = os.environ['MONGO_DB_URI']
    
    # Connect to MongoDB
    client = MongoClient(mongo_uri)
    db = client[os.environ['MONGO_DB_NAME']]
    collection = db['event_stream']
    
    # Process SQS messages
    for record in event['Records']:
        # Parse the message body
        message = json.loads(record['body'])
        
        # Insert the message into MongoDB
        collection.insert_one(message)
    
    client.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps({ 'success': True })
    }
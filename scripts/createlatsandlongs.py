import requests
import sys  
import os
import json
import pymongo
from collections import Counter

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dv_project"]
reviewcol = mydb["reviews"]
offeringcol = mydb["offerings"]

def main():
    filepath = sys.argv[1]
    if not os.path.isfile(filepath):
        print("File path {} does not exist. Exiting...".format(filepath))
        sys.exit()
    bag_of_words = {}
    with open(filepath) as fp:
        cnt = 0
        for line in fp:
            cnt += 1
            y = json.loads(line)
            GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
            stri = ''
            if 'street-address' in y['address']:
                stri += y['address']['street-address']
                stri += ' '
            if 'locality' in y['address']:
                stri += y['address']['locality']
                stri += ' '
            if 'postal-code' in y['address']:
                stri += y['address']['postal-code']
            if not stri == '':
                params = {
                    'address': stri,
                    'sensor': 'false',
                    'region': y['address']['region'],
                    'key': 'AIzaSyChU9ySBMW2VOEjCux36Vij7iJJl1LYi7Y'
                }
                req = requests.get(GOOGLE_MAPS_API_URL, params=params)
                res = req.json()
                # Use the first result
                result = res['results'][0]
                myquery = { "id": y['id'] }
                newvalues = { "$set": { "long": result['geometry']['location']['lng'], "lat": result['geometry']['location']['lat'] } }
                myreviews = offeringcol.update_one(myquery,newvalues)
            print(cnt)
if __name__ == '__main__':  
    main()
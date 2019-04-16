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
            myquery = { "offering_id": y['id'] }
            myreviews = reviewcol.find(myquery)
            myratings = [d['ratings'] for d in myreviews]
            total = sum(map(Counter, myratings), Counter())
            new_map = {}
            for k, v in total.items():
                summ = 0 
                for x in myratings:
                    if(k in x):
                        summ += 1
                new_map[k] = v/summ
            y['ratings'] = new_map
            offeringcol.insert_one(y)
        print(cnt)
if __name__ == '__main__':  
    main()
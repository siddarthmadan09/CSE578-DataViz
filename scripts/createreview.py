import sys  
import os
import json
import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dv_project"]
mycol = mydb["reviews"]

def main():
    filepath = sys.argv[1]
    if not os.path.isfile(filepath):
        print("File path {} does not exist. Exiting...".format(filepath))
        sys.exit()
    with open(filepath) as fp:
        cnt = 0
        mycol.remove()
        for line in fp:
            cnt += 1
            y = json.loads(line)
            mycol.insert_one(y)
        print(cnt)
if __name__ == '__main__':  
    main()
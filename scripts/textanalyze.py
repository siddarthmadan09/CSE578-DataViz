import pandas as pd
import numpy as np
import nltk
from nltk.corpus import stopwords
import sys  
import os
import json
import pymongo
from collections import Counter
from bson.json_util import dumps
import string
import sklearn
from datetime import datetime
nltk.download('vader_lexicon')
from nltk.sentiment.vader import SentimentIntensityAnalyzer

start=datetime.now()
with open("./positivewords.json") as json_file:  
    positivewords = json.load(json_file)
with open("./negativewords.json") as json_file:  
    negativewords = json.load(json_file)
analyzer = SentimentIntensityAnalyzer()
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["dv_project"]
reviewcol = mydb["reviews"]
offeringcol = mydb["offerings"]
pos_words = {}
neg_words = {}
def text_process_pos(text):
    global pos_words
    nopunc = [char for char in text if char not in string.punctuation]
    nopunc = ''.join(nopunc)
    for word in nopunc.split():
        if word.lower() not in stopwords.words('english'):
            if word.lower() in positivewords:
                if word.lower() not in pos_words:
                    pos_words[word.lower()] = 1
                else:
                    pos_words[word.lower()] += 1

def text_process_neg(text):
    global neg_words
    nopunc = [char for char in text if char not in string.punctuation]
    nopunc = ''.join(nopunc)
    for word in nopunc.split():
        if word.lower() not in stopwords.words('english'):
            if word.lower() in negativewords:
                if word.lower() not in neg_words:
                    neg_words[word.lower()] = 1
                else:
                    neg_words[word.lower()] += 1

def main():
    global pos_words
    global neg_words
    filepath = "../data/offering.txt"
    if not os.path.isfile(filepath):
        print("File path {} does not exist. Exiting...".format(filepath))
        sys.exit()
    with open(filepath) as fp:
        cnt = 0
        for line in fp:
            cnt += 1
            y = json.loads(line)
            pos_words = {}
            neg_words = {}
            pos = []
            neg =[]


            myquery = { "id": y['id'] }
            myoffering = offeringcol.find(myquery)
            myoffering = dumps(myoffering)
            myoffering = json.loads(myoffering)
            if not 'positive' in myoffering[0]:
                myquery = { "offering_id": y['id'] }
                myreviews = reviewcol.find(myquery)
                myreviews = dumps(myreviews)
                myreviews = json.loads(myreviews)
                X = myreviews
                X = X[:50]
                for x1 in X:
                    if 'text' in x1:
                        polarity_data = analyzer.polarity_scores(x1['text'])
                        if polarity_data['pos'] >= 0.05 + polarity_data['neg']:
                            pos.append(x1['text'])
                        else:
                            neg.append(x1['text'])
                for p in pos:
                    text_process_pos(p)
                for n in neg:
                    text_process_neg(n)
                ps = sorted(pos_words, key=pos_words.get, reverse=True)[:30]
                ns = sorted(neg_words, key=neg_words.get, reverse=True)[:30]
                p1 = []
                n1 = []
                for p in pos_words:
                    if p in ps:
                        p1.append({'word': p,'count': pos_words[p]})
                for n in neg_words:
                    if n in ns:
                        n1.append({'word': n,'count': neg_words[n]})       
                print p1
                print n1
                print (datetime.now()-start)
                myquery = { "id": y['id'] }
                newvalues = { "$set": { "positive": p1, "negative":n1 } }
                myreviews = offeringcol.update_one(myquery,newvalues)
            print(cnt)

if __name__ == '__main__':  
    main()
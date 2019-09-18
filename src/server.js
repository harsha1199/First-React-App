import express from 'express'
import bodyParser from 'body-parser'
import { MongoClient } from 'mongodb'
import path from 'path';
const app = express();

app.use(express.static(path.join(__dirname,'/build')));
app.use(bodyParser.json());

const withDB = async (operations) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');
        await operations(db);
        client.close();
    }
    catch (error) {
        res.status(500).json({
            message: 'Error connecting DB ', error
        });
    }
};

app.get('/api/artcile/:name', async (req, res) => {
    const articleName = req.params.name;
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articlesInfo);
    })

});

app.post('/api/artcile/:name/upvote', (req, res) => {
    const articleName = req.params.name;
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({name: articleName}, {
            '$set': {
                upvotes: articlesInfo.upvotes+1,
            },
        });
        const updatedArticlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticlesInfo);
    })
});

app.post('/api/artcile/:name/add-comment', (req, res) => {
    const { user, text } = req.body;
    const articleName = req.params.name;

    withDB(async(db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({name: articleName}, {
            '$set': {
                comments: articlesInfo.comments.concat({user, text}),
            },
        });
        const updatedArticlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticlesInfo);
    });
});

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname+'/build/index.html'));
})

app.listen(8000, () => console.log('Listening at 8000'));
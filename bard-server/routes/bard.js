/**
 * Created by davidraleigh on 5/28/15.
 */
var express = require('express');
var router = express.Router();

var url = 'mongodb://localhost:27017/bard';

/* GET all shakespeare play titles listing. */
router.get('/playList', function(req, res, next) {
    var playList = {playname : 'Othello'};
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(playList));
});

module.exports = router;



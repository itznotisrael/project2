var express = require('express');
var router = express.Router();
//const fetch = require('node-fetch');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', 
    {
      title: 'Project 2: Anime Explorer', 
      h1: 'Anime Explorer',
    });
});

// Fetch anime data from Jikan API
/*router.get('/fetch', async (req, res) => {
  const { type = 'ona', page = 1 } = req.query;

  try {
    const resqonse = await fetch(`https://api.jikan.moe/v4/top/anime?type=${type}&page=${page}`);
    const data = await resqonse.json();

    res.json({
      success:true,
      data: data.data,
      pagination: data.pagination
    });
  } catch(error) {
    console.error(error);
    res.json({ success: false, message: 'Error fetching anime data. '});
  }
});*/

module.exports = router;

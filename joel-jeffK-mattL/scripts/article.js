'use strict';

function Article (rawDataObj) {
  this.author = rawDataObj.author;
  this.authorUrl = rawDataObj.authorUrl;
  this.title = rawDataObj.title;
  this.category = rawDataObj.category;
  this.body = rawDataObj.body;
  this.publishedOn = rawDataObj.publishedOn;
}

// REVIEW: Instead of a global `articles = []` array, let's attach this list of all articles directly to the constructor function. Note: it is NOT on the prototype. In JavaScript, functions are themselves objects, which means we can add properties/values to them at any time. In this case, the array relates to ALL of the Article objects, so it does not belong on the prototype, as that would only be relevant to a single instantiated Article.
Article.all = [];

// COMMENTed: Why isn't this method written as an arrow function?
// Because it accesses the contextual 'this' for the given object.
Article.prototype.toHtml = function() {
  let template = Handlebars.compile($('#article-template').text());

  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);

  // COMMENTed: What is going on in the line below? What do the question mark and colon represent? How have we seen this same logic represented previously?
  // Not sure? Check the docs!
  // The line below represents a ternary operator that takes what's before the '?' as the conditional. and either, sets it to true (before the ':') or, false (after the ':').
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';
  this.body = marked(this.body);

  return template(this);
};

// REVIEW: There are some other functions that also relate to all articles across the board, rather than just single instances. Object-oriented programming would call these "class-level" functions, that are relevant to the entire "class" of objects that are Articles.

// REVIEW: This function will take the rawData, how ever it is provided, and use it to instantiate all the articles. This code is moved from elsewhere, and encapsulated in a simply-named function for clarity.

// COMMENTed: Where is this function called? What does 'rawData' represent now? How is this different from previous labs?
// It's called in Article.fetchAll() below.  'rawData' is either what was pulled from local storage or from the JSON file.  In previous labs, the data was already in an adjacent javascript file so we didn't need to call the method elsewhere.  It always ran with initialization of the page.
Article.loadAll = rawData => {
  rawData.sort((a,b) => (new Date(b.publishedOn)) - (new Date(a.publishedOn)))

  rawData.forEach(articleObject => Article.all.push(new Article(articleObject)))
}

// REVIEW: This function will retrieve the data from either a local or remote source, and process it, then hand off control to the View.
var that;
function getHackerData() {
  $.getJSON('data/hackerIpsum.json', function(data, message, xhr) {
    // - we then need to load all the data into Article.all with the .loadAll function above
    Article.loadAll(data);
    // - then we can render the index page
    articleView.initIndexPage();
    // - we need to cache it in localStorage so we can skip the server call next time
    localStorage.rawData = JSON.stringify(data);

    localStorage.etag = xhr.getResponseHeader('etag');
  });
}
Article.fetchAll = () => {
  // REVIEW: What is this 'if' statement checking for? Where was the rawData set to local storage?
  if (localStorage.rawData) {
    // REVIEW: When rawData is already in localStorage we can load it with the .loadAll function above and then render the index page (using the proper method on the articleView object).
    //DONE: This function takes in an argument. What do we pass in to loadAll()?
    $.ajax({
      url : "data/hackerIpsum.json",
      type : 'HEAD',
      success : function(data, message, xhr) {
        if (localStorage.etag === xhr.getResponseHeader('etag')) {
          Article.loadAll(JSON.parse(localStorage.rawData));

          //DONE: What method do we call to render the index page?
          articleView.initIndexPage();
          // COMMENTed: How is this different from the way we rendered the index page previously? What the benefits of calling the method here?
          // The difference is that we are now checking for content then running the initIndexPage, and pulling from a remote source instead of a local one.
          console.log('Loaded from Local Storage');
          console.log('data correct');
        } else {
          console.log('data changed');
          getHackerData();
        }
      }
    })

  } else {
    // DONE: When we don't already have the rawData:
    // - we need to retrieve the JSON file from the server with AJAX (which jQuery method is best for this?)
    getHackerData();

    // COMMENTed: Discuss the sequence of execution in this 'else' conditional. Why are these functions executed in this order?
    // Article.loadAll() must come before articleView.initIndexPage() because it needs the data to be loaded in order to initialize.  Sending to local storage can happen anywhere in that order.
  }
}

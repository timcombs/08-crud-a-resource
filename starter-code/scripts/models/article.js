(function(module) {
  function Article (opts) {
    /* DONE: Convert property assignment to Functional Programming style.
        Now, ALL properties of `opts` will be assigned as properies of the
        newly created article object. */
    Object.keys(opts).forEach(function(prop, index, keys) {
      this[prop] = opts[prop];
    },this); // Specify that 'this' is to be bound to the constructor instance.
  }

  Article.allArticles = [];

  Article.prototype.toHtml = function(scriptTemplateId) {
    var template = Handlebars.compile(scriptTemplateId.text());
    this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);
    this.publishStatus = this.publishedOn ? 'published ' + this.daysAgo + ' days ago' : '(draft)';
    this.body = marked(this.body);
    return template(this);
  };

  // Set up a DB table for articles.
  Article.createTable = function() {
    webDB.execute(
      'CREATE TABLE IF NOT EXISTS articles (id INT PRIMARY KEY, title VARCHAR, author VARCHAR, authorUrl VARCHAR, category VARCHAR, publishedOn DATE, body VARCHAR);', // TODO: What SQL command do we run here inside these quotes?
      function() {
        console.log('Successfully set up the articles table.');
      }
    );
  };

  // DONE: Refactor to expect the data from the database, rather than localStorage. populating the Article.allArticles array
  //loadAll method to be run on an object which sends it to
  Article.loadAll = function(rows) {
    Article.allArticles = rows.map(function(ele) {
      return new Article(ele);
    });
  };

  Article.fetchAll = function(nextFunction) {
    /* If the DB has data already, we'll load up the data (most recent article first!), and then hand off control to the View. Otherwise (if the DB is empty) we need to retrieve the JSON and process it. */

    //SELECT query gets back an array
    webDB.execute('SELECT * FROM articles', function(rows) {
      // TODO: fill these quotes to query our table.
      if (rows.length) {
        /* TODO:
           1 - Use Article.loadAll to instanitate these rows,
           2 - Pass control to the view by invoking the next function that was passed in to Article.fetchAll */
        Article.loadAll(rows);
        nextFunction();
      }else{
        //AJAX call returns a JSON object
        $.getJSON('/data/hackerIpsum.json', function(responseData) {
          // Save each article from this JSON file, so we don't need to request it next time:
          responseData.forEach(function(obj) {
            var article = new Article(obj); // This will instantiate an article instance based on each article object from our JSON.
            /* TODO:
               1 - 'insert' the newly-instantiated article in the DB:
                (hint: what can we call on this article instance?). */
            //console.log(article);
            article.insertRecord();
          });
          // Now get ALL the records out the DB, with their database IDs:
          webDB.execute('SELECT * FROM articles', function(rows) {
            //TODO: select our now full table
            //TODO:
            // 1 - Use Article.loadAll to generate our rows,
            // 2 - Pass control to the view by calling the next function that was passed in to Article.fetchAll
            Article.loadAll(rows);
            nextFunction();
          });
        });
      }
    });
  };

  Article.prototype.insertRecord = function() {
    webDB.execute(
      [
        {
          // TODO: Insert an article instance into the database:
          // NOTE: this method will be called elsewhere after we retrieve our JSON
          'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?)', // <----- complete our SQL command here, inside the quotes.
          'data': [this.title, this.author, this.authorUrl, this.category, this.publishedOn, this.body]
        }
      ]
    );
  };

  Article.prototype.deleteRecord = function() {
    webDB.execute(
      [
        {
          // TODO: Delete an article instance from the database based on its id:
          /* Note: this is an advanced admin option, so you will need to test out an individual query in the console */
          'sql': 'DELETE FROM articles WHERE id = ?', // <--- complete the command here, inside the quotes;
          'data': [this.id]
        }
      ]
    );
  };

  Article.truncateTable = function() {
    webDB.execute(
      // TODO: Use correct SQL syntax to delete all records from the articles table.
      'DELETE FROM articles;' // <----finish the command here, inside the quotes.
    );
  };

  Article.allAuthors = function() {
    return Article.allArticles.map(function(article) {
      return article.author;
    })
    .reduce(function(uniqueNames, name) {
      if (uniqueNames.indexOf(name) === -1) {
        uniqueNames.push(name);
      }
      return uniqueNames;
    }, []);
  };

  Article.numWordsAll = function() {
    return Article.allArticles.map(function(article) {
      return article.body.match(/\w+/g).length;
    })
    .reduce(function(a, b) {
      return a + b;
    });
  };

  Article.numWordsByAuthor = function() {
    return Article.allAuthors().map(function(currentAuthor) {
      return {
        name: currentAuthor,
        numWords: Article.allArticles.filter(function(article) {
          return article.author === currentAuthor;
        })
        .map(function(currentAuthorsArticle) {
          return currentAuthorsArticle.body.match(/\w+/g).length;
        })
        .reduce(function(previousWords, currentWords) {
          return previousWords + currentWords;
        })
      };
    });
  };

// TODO: ensure that our table has been setup.
  Article.createTable();
  module.Article = Article;
})(window);

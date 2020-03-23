const Book = require('../models/Book');
const User = require('../../../users/models/User');

module.exports = {
    getAddBook: (req, res, next) => {
        return res.render('admin/add-books');
    },

    getFavorites: (req, res, next) => {
        Book.find({}).then((book) => {
            return res.render('main/favorites', { book });
        });
    },

    getSingleBook: (req, res, next) => {
        Book.findById({ _id: req.params.id }, (err, book) => {
            if (err) return next(err);
            return res.render('main/single-book', { book, errors: req.flash('error') });
        });
    },

    addBook: (req, res, next) => {
        const { rank, title, author, image, description, link } = req.body;

        const book = new Book();
        book.rank = rank;
        book.title = title;
        book.author = author;
        book.image = image;
        book.description = description;
        book.link = link;

        book.save((err) => {
            if (err) return next(err);
            return res.json({message: 'successfully created book!'});
        })
    },

    addToFavorites: (req, res, next) => {
        User.findOne({ email: req.user.email }).then((user) => {
            if (user.favorites.includes(req.params.id)) {
                Book.findById({ _id: req.params.id }, (err, book) => {
                    if (err) return next();
                    return res.render('main/single-book', { book, errors: 'This book is already in your favorites.' });
                });
                return;
            }

            user.favorites.push( req.params.id );
            
            user.save((err) => {
                if (err) return next(err);
                return res.redirect('/');
            })
        })
        .catch((err) => next(err));
    },

    delFromFavorites: (req, res, next) => {
        User.findOne({ email: req.user.email }).then((user) => {
            user.favorites = user.favorites.filter((book) => book !== req.params.id);

            user.save((err) => {
                if (err) return next(err);
                return res.redirect('/api/books/favorites');
            })
        })
        .catch((err) => next(err));
    },

    checkOutBook: (req, res, next) => {
        Book.findOne({ _id: req.params.id }).then((book) => {
            book.status.available = false;
            book.status.owner = req.user._id;
            book.status.checkedOut = Date.now();

            book.save((err) => {
                if (err) return next(err);
                return res.redirect(`/api/books/single-book/${req.params.id}`);
            })
        })
        .catch((err) => next(err));
    },

    checkOutUserBook: (req, res, next) => {
        User.findOne({ email: req.user.email }).then((user) => {
            if (user.checked_books.length > 0) {
                Book.findById({ _id: req.params.id }, (err, book) => {
                    if (err) return next();
                    return res.render('main/single-book', { book, errors: 'You can only check out one book at a time!' });
                });
                return;
            }

            user.checked_books.push({ bookTitle: req.params.id, checkOut: Date.now() });

            user.save((err) => {
                if (err) return next(err);
                next();
            })
        })
        .catch((err) => next(err));
    },

    checkInBook: (req, res, next) => {
        Book.findOne({ _id: req.params.id }).then((book) => {
            book.status.available = true;
            book.status.owner = '';
            book.status.checkedIn = Date.now(); 

            book.save((err) => {
                if (err) return next(err);
                return res.redirect(`/api/books/single-book/${req.params.id}`);
            })
        })
        .catch((err) => next(err));
    },

    checkInUserBook: (req, res, next) => {
        User.findOne({ email: req.user.email }).then((user) => {
            user.checked_books.pop();

            user.save((err) => {
                if (err) return next(err);
                next();
            })
        })
        .catch((err) => next(err));
    }
};

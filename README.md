# Splitting nodes with required content

## Setup

Install the node modules and run:

```
npm install
npm start
```

Your browser should open up to localhost:8080 with an editable page.

## Test

In the browser you can type in a title and enter text into the first scene. Type `"***"` in a new paragraph to split a
scene into two. You should be able to tell this happens because there will be a nicely formatted `"*  *  *"` separating
the two scenes.

Type "===" in an empty paragraph and you get an error in the console from trying to split the chapter. This is because
the chapter's `content` property is set to `"title scene+"` and the split doesn't create the `title` like a regular
insert operation might.

If you change the chatper's `content` property to `"title? scene+"` in the file `editor.js`, you will be able to now
split the chapter using `===` but the chapters won't automatically have titles.

### Additional bug

Another unrelated bug you will see is when pressing Enter after entering the chapter title it has a transform error.
This is because it doesn't navigate very well from the text in the title element across a deeper block (the scene) into
the text of the paragraph below.

# typed-template

![travis](https://img.shields.io/travis/lifegadget/typed-templates.svg) ![coveralls](https://coveralls.io/repos/github/lifegadget/typed-templates/badge.svg?branch=master) ![license](http://img.shields.io/badge/license-MIT-brightgreen.svg)
[![twitter](https://img.shields.io/twitter/url/http/yankeeinlondon.svg?style=social) ](http://twitter.com/intent/tweet?text=http://bit.ly/typed-template)

Lorem ipsum dolor sit amet consectetur adipisicing elit. Facilis at ab recusandae fugiat, saepe molestiae doloribus assumenda rem voluptates non illum nemo dolorem architecto animi obcaecati esse eius et iure

## Getting started

First add it as a dependency to your project:

```
# using npm
npm install --save typed-template
# using yarn
yarn add typed-template
```

Now you'll want to create some directories in which you'll leverage this solution. Create the following directories off the root of your project:

* templates/**templates**
* templates/**layouts**

### Layouts

Now let's create the most basic layout you can create:

> templates/layouts/**default.hbs**

```hbs
{{template}}
```

Bear in mind a "layout" is a template that _surrounds_ or _encapsulates_ a **template** (more on _templates_ in a moment). In the above example we are basically doing nothing other than displaying the underlying template. Not terribly exciting so let's take a more sophisticated example ... let's use "email" as an example.

`typed-template` layouts are organized into "channels" (and sub-channels). So in the case of **email** that is considered a "channel" which contains two sub-channels:

* html
* text

So just focusing on the _html_ sub-channel we might create the following file:

> templates/layouts/email-html/**default.hbs**

```hbs
<h1>Welcome Earthling</h1>
<div class="body">
  {{template}}
</div>
```

whereas the _text_ sub-channel might be:

> templates/layouts/email-text/**default.hbs**

```hbs
Welome Earthling

{{template}}
```

So now -- by default -- every email template will be wrapped by our default layouts.

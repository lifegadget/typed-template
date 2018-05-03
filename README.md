# typed-template

![travis](https://img.shields.io/travis/lifegadget/typed-templates.svg) ![coveralls](https://coveralls.io/repos/github/lifegadget/typed-templates/badge.svg?branch=master) ![license](http://img.shields.io/badge/license-MIT-brightgreen.svg)
[![twitter](https://img.shields.io/twitter/url/http/yankeeinlondon.svg?style=social) ](http://twitter.com/intent/tweet?text=http://bit.ly/typed-template)

This library is meant to be a relatively simple, yet opinionated, library that will help transform structured information into various outputs based on expected output channels (e.g., email, sms, etc.)

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

## Template Structure

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

### Templates

Where _layouts_ are templates "at a high level", the "official" templates which reside in the `templates/templates` directory represent the core contents of your message content. Unlike the _layouts_ which are organized by "channel/sub-channel", the _templates_ are organized by a template name. This makes sense because templates are likely to be structured on around **topics** and are less generic than _layouts_. That said, templates also have support for channel/sub-channel distinctions but the structure is inverted (aka, directories are created for topics, filenames distinguish the channel).

Let's look at another example. Let's imagine we have a website and we are sending "welcome" emails when customers sign-up and then two weeks later we send a follow-up email to keep engagement strong and offer some ideas on how to get more value from the website. We might then create two topics: "welcome" and "engagement". Further, because our customers are very "real-time" we have agreed to send and SMS and email every time there is an "outage".

This might look like so:

```sh
templates / templates
               \_ welcome
               \_ engagement
               \_ outage
```

In the **welcome** and **engagement** topics we are only expecting email so we'd likely have two handlebars files `email-html.hbs` and `email-text.hbs`. In the **outage** folder, however, we are also expecting SMS so we'd add `sms.hbs` too. Of course, if we wanted to keep things dead simple we could just put a `default.hbs` into any of the topic folders and ALL channels would use that template to build their messages.

### Handlebars

Whether we're talking about _templates_ or _layouts_ the grammer they are being written in is a popular "curly-based" templating language called [Handlebars](https://handlebarsjs.com). We will not cover the specifics of it here but please refer to their docs to understand the full scope of what you can do with your templates/layouts.

## API Surface

Up to now we've talked about adding templating structure but not how you would use this in your code. Let's change gears. Here's an example modelled losely off of our "engagement" email example above ...

```ts
const data = {
  name: "Bob Barker",
  tier: "gold",
  memberSince: "23 July, 2018"
};
const template = await TypedTemplate.create()
  .topic("engagement")
  .channels("email")
  .substitute(data)
  .generate();
```

which would result in template being a data structure of:

```ts
interface ITypedTemplate {
  emailText: string;
  emailHtml: string;
}
```

and where the `template.emailHtml` would be composed in a web-browser or email client like so:

```
┌─────────────────────────┐
│  Layout / email-html /  │
│       default.hbs       │
│                         │
│   ┌─────────────────┐   │
│   │                 │   │
│   │   template /    │   │
│   │  engagement /   │   │
│   │ email-html.hbs  │   │
│   │                 │   │
│   └─────────────────┘   │
│                         │
└─────────────────────────┘
```

### List Datasets

Above was a simple example where we were sending to a single user but more often there is a need to send to multiple users. The most typical way of achieving this is to pass in an array into the `.substitute()` method. This signals that there are multiple templates and the resulting `.generate()` call will result in:

```ts
const template: ITypedTemplate[] = ...
```

However, there is another way -- which may be more efficient in many cases -- where instead of the `.generate()` call you instead call `.iterator()`:

```ts
const data = [ {},{}, ... ]
const template: ITypedTemplateIterable = TypedTemplate.create()
  .topic("engagement")
  .channels("email")
  .substitute(data)
  .iterator();

while(!template.next().done) {
  //...
}
```

### Pre-compiling Templates

While not always necessary, it is not entirely uncommon to have templates written in Handlebars _pre-compiled_ to a Javascript function. Then at runtime the compilation step is no longer needed. To aid in this, **typed-template** provides a static class method which will precompile all HBS files in your `templates` directory:

```ts
await TypedTemplate.precompile();
```

This can then be incorporated into your build tooling to ensure that precompiled templates are ready for use. In cases where you are taking this optimisation step you also need to add a call to `.usePrecompiled()` in the fluent interface so at runtime it knows it can skip compilation w/o needing to check using file IO.

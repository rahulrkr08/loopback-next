---
title: 'Fields filter'
lang: en
keywords: LoopBack 4.0, LoopBack 4, fields
sidebar: lb4_sidebar
permalink: /doc/en/lb4/Fields-filter.html
---

A _fields_ filter specifies properties (fields) to include or exclude from the results.

### Node.js API

{% include content/angular-methods-caveat.html lang=page.lang %}

<pre>
{ fields: {<i>propertyName</i>: <true|false>, <i>propertyName</i>: <true|false>, ... } }
</pre>

Where:

* _propertyName_ is the name of the property (field) to include or exclude.
* `<true|false>` signifies either `true` or `false` Boolean literal. Use `true` to include the property or `false` to exclude it from results.

By default, queries return all model properties in results. However, if you specify at least one fields filter with a value of `true`,
then by default the query will include **only** those you specifically include with filters.

### REST API

{% include warning.html content="
As a known bug, the option `<false>` does not work for url for now. Please include the properties you need to meet your requirement. The bug is tracked in the GH issue [#4992](https://github.com/strongloop/loopback-next/issues/4992" %}

<pre>
filter[fields][<i>propertyName</i>]=<true>&filter[fields][<i>propertyName</i>]=<true>...
</pre>

Note that to include more than one field in REST, use multiple filters.

You can also use [stringified JSON format](Querying-data.html#using-stringified-json-in-rest-queries) in a REST query.

### Examples

Return customer information only with `name` and `address`, and hide their `id`:

{% include code-caption.html content="Node.js API" %}

```ts
await customerRepository.find({fields: {id: false, name: true, address: true}});
```

{% include code-caption.html content="REST" %}

{% include warning.html content="
As a known bug, the option `<false>` does not work for url for now. Please include the properties you need to meet your requirement. The bug is tracked in the GH issue [#4992](https://github.com/strongloop/loopback-next/issues/4992" %}

`/customers?filter[fields][name]=true&filter[fields][address]=true`

Returns:

```ts
[
  {
    name: 'Mario',
    address: '8200 Warden Ave'
  }, 
  {
    name: 'Luigi',
    address: '999 Avenue Rd'
  },
  ...
]
```

Exclude the `password` property:

{% include code-caption.html content="Node.js API" %}
```ts
await UserRepository.find({fields: {password: false}});
```

{% include code-caption.html content="REST" %}

Include all properties except `password` as the workaround:
`/users?filter[fields][name]=true&filter[fields][email]=true&filter[fields][id]=true...`

Notice that `fields` clause is to include/exclude the result from the **database**, e.g if you would like to check `password` for users, the above example would fail as `password` is undefined. If you need the property and also want to hide it from the response, set the [hidden properties](Model.md#hidden-properties) in the model definition might help.
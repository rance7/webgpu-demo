# Project Name

> webgpu-demo

## Introduction

This project allows you to render your obj model with texture on web with your own gpu. You need basic knowledge of webgpu for correctly renderring a 3d model.

## Prerequisites

This project requires NodeJS and NPM.
[Node](http://nodejs.org/) and [NPM](https://npmjs.org/) are really easy to install.
To make sure you have them available on your machine,
try running the following command.

```sh
$ npm -v && node -v
10.5.0
v21.7.0
```

## Table of contents

- [Project Name](#project-name)
  - [Prerequisites](#prerequisites)
  - [Table of contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Serving the app](#serving-the-app)
    - [Building a distribution version](#building-a-distribution-version)
  - [Authors](#authors)
  - [License](#license)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development. Please import your own obj model and texture file, and correct the file path in main.ts.

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

Start with cloning this repo on your local machine:

```sh
$ https://github.com/rance7/webgpu-demo.git
$ cd webgpu-demo
```

To install and set up the library, run:

```sh
$ npm install 
```

## Usage

### Serving the app

```sh
$ npm start
```

Then you can visit [webgpu page](http://localhost:8080) to look the render result. By modifying the type in the upper right corner to control the viewing angle, *arcball* can rotate the viewing angle, and *WASD* can change the distance from the object.

### Building a distribution version

```sh
$ npm run build
```

This task will create a distribution version of the project
inside your local `dist/` folder

## Authors

* **Rance** - *All work* - [Rance](https://github.com/JohnDoe)

## License

[MIT License](https://andreasonny.mit-license.org/2019) © Andrea SonnY
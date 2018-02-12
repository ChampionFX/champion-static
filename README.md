Champion-Static
===============

This repository contains the static HTML, Javascript, CSS, and images content of the [Champion-FX.com](http://www.champion-fx.com) website.

#### Please submit your PR against `beta` branch.

## Installation

In order to work on your own version of the Champion-FX.com Javascript and CSS, please **fork this project**.

You will also need to install the following on your development machine:

- Ruby, RubyGems
- Sass (`sudo gem install sass`)
- Node.js and NPM (see <https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager>)

- Go to project root

```bash
npm install
sudo npm install -g grunt-cli

curl -L https://cpanmin.us | sudo perl - App::cpanminus
sudo cpanm Carton
cd scripts
sudo carton install
```

#### Note: 
You need to have:

- The latest version of `node`
- Version 4.x.x of `npm` (`npm install npm@4 -g`)
- `Perl v5.18.2`

In Mac systems, the safest way to install an old version of Perl is: 

```
curl -L https://install.perlbrew.pl | bash
source ~/perl5/perlbrew/etc/bashrc
perlbrew init
perlbrew install 5.18.2
perlbrew switch perl-5.18.2
```


How to work with this project
=============================

### Deploy to your gh-pages for the first time

1. Register your application [here](https://developers.binary.com/applications/). This will give you the ability to redirect back to your github pages after login.
Use `https://YOUR_GITHUB_USERNAME.github.io/champion-static/en/logged_inws.html` for Redirect URL.

2. In `src/javascript/common/socket.js`: Replace the number `2472` in `getAppId()` function with the `Application ID` of your registered application.
  * **NOTE:** In order to avoid accidentally committing personal changes to this file, use `git update-index --assume-unchanged src/javascript/common/socket.js`

3. Run `grunt dev`


### Deploy js/css and template changes together

```
grunt dev
```


### Deploy only js/css changes

```
grunt deploy
```


### Deploy some template changes

```
grunt dev --path=about-us
```


### Using sub-folders
There are times that you are working on various branches at the same time, and you want to deploy/test each branch separately on your gh-pages, you can simply use `--branch=branchname` for grunt commands:
- `grunt dev --branch=branchname`
This will deploy your changes to a sub-folder named: `br_branchname` and it can be browsed at: `https://YOUR_GITHUB_USERNAME.github.io/champion-static/br_branchname/`

In order to remove the created folders from your gh-pages, you can use either:
- `grunt dev --cleanup`: removes all `br_*` folders and deploys to the root folder.

  or
- `grunt shell:remove_folder --folder=br_branchname1,br_branchname2,...`: only removes the specified folder(s) from your gh-pages.

### Preview on your local machine
- To preview your changes locally, run `sudo grunt serve`
- It will watch for js/css changes and rebuild on every change you make.
- To test changes made to templates, you need to re-compile them:
  - `grunt shell:compile_dev` to re-compile all templates.
  - `grunt shell:compile_dev --path=about-us` to re-compile only template(s) which serve about-us path in URL.


## Release to Production

```
grunt release --beta=1|--production=1|--translations=1 [--cleanup] [--reset]
```
(The value `1` is needed when more than one option is used)

###Parameters:
- `--beta` or `--production` or `--translations` (mandatory)
  - In order to prevent accidentally releasing to the wrong target, it is mandatory to provide one of these parameters.
  - Your remote origin will be checked to be the correct target of the given parameter.
  - Your current branch will be checked to be the correct branch of the given parameter.
- `--cleanup` [optional]
  - Creates CNAME file with proper value according to remote origin
  - Deploys to gh-pages with the option `add: false`
- `--reset` [optional]
  - Removes all commits from `gh-pages` branch before release.

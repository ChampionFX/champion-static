#!/bin/sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
WHITE='\033[1;37m'
RESET='\033[0m'

if ! [ -x "$(command -v crowdin)" ]; then
    if [ -f /usr/local/bin/crowdin-cli.jar ]; then
        alias crowdin="java -jar /usr/local/bin/crowdin-cli.jar"
    else
        echo ${YELLOW}"crowdin-cli not found. Please follow the instructions here: https://support.crowdin.com/cli-tool/#installation"${RESET}
        exit 1
    fi
fi

if [[ $(git config --get remote.origin.url) =~ ChampionFX/champion-static ]]; then
    echo ${RED}"  > ERROR: "${RESET}"remote 'origin' should be your fork."
    exit 1
fi

function message {
    echo ${GREEN}"  >"${RESET} $1
}

function confirm {
    read -p "$(echo "\n${WHITE}$1 ${RESET}(y/n)${YELLOW}") " -n 1 -r &&
    echo "${RESET}"
}

cd $(git rev-parse --show-toplevel) &&

message "Updating translations branch" &&
git checkout translations &&
git fetch upstream translations &&
git reset --hard upstream/translations &&

confirm "Include the beta changes as well? (merge beta into translations)" &&
if [[ $REPLY =~ ^[Yy]$ ]]
then
    message "Updating beta branch" &&
    git fetch upstream beta:beta &&
    message "Merging beta into translations"
    git merge upstream/beta --no-edit
fi &&

confirm "Update the source file (messages.pot) and push to Crowdin?" &&
if [[ $REPLY =~ ^[Yy]$ ]]
then
    message "Updating translations source file" &&
    ./scripts/translation.sh &&
    message "Uploading source file to Crowdin"
    crowdin upload sources
fi &&

confirm "Download translation files and update javascript texts?" &&
if [[ $REPLY =~ ^[Yy]$ ]]
then
    message "Downloading translation files from Crowdin (*.po)" &&
    crowdin download &&
    message "Updating javascript translation files (*.js)"
    ./scripts/js_translation.sh
fi &&

confirm "Commit changes and push to origin?" &&
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cd $(git rev-parse --show-toplevel) &&
    message "Committing"
    git commit -a -m "Update translations" &&
    message "Pushing"
    git push origin translations
fi &&

echo ${GREEN}"\nSuccessfully Done." &&

if [[ $REPLY =~ ^[Yy]$ ]]
then
    confirm "Open github to submit the PR?" &&
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        open "https://github.com/ChampionFX/champion-static"
    fi
fi

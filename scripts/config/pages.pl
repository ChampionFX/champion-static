#!/usr/bin/perl

use strict;
use warnings;

sub all_pages {
    return (
        # url pathname,                template file path,             layout,       title,                  exclude languages
        ['home',                       'home/index',                   'full_width', 'ChampionFX'],
        ['404',                        'static/404',                   'full_width', '404'],
        ['about-us',                   'about/index',                  'full_width', 'About Us'],
        ['contact',                    'about/contact',                'full_width', 'Contact Us'],
    );
}

1;

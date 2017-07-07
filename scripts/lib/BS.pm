package BS;

use strict;
use warnings;
use v5.10;
use base 'Exporter';
use Path::Tiny;
use JSON;
use YAML::XS;
use Mojo::URL;
use Template;
use Template::Stash;
use Format::Util::Numbers;

our @EXPORT_OK = qw/
    root_path is_dev set_is_dev branch set_branch
    localize set_lang all_languages
    get_static_hash set_static_hash

    root_url

    tt2

    css_files js_config menu
    /;

sub root_path {
    return path(__FILE__)->parent->parent->parent->absolute->stringify;
}

# for developer
our $IS_DEV = 0;
sub is_dev { return $IS_DEV; }
sub set_is_dev { $IS_DEV = 1; }

our $BRANCH = '';
sub branch { return $BRANCH; }
sub set_branch {
    $BRANCH = shift;
    # chomp ($BRANCH = `git symbolic-ref --short HEAD`); $BRANCH = '_'.(split('/', $BRANCH))[-1];
}

our $LANG = 'en';

sub set_lang {
    $LANG = shift;
}

my %__lh;
sub localize {
    my @texts = @_;

    require BS::I18N;
    $__lh{$LANG} //= BS::I18N::handle_for($LANG)
        || die("could not build locale for language $LANG");

    return $__lh{$LANG}->maketext(@texts);
}

sub all_languages {
    return $BRANCH eq 'translations' ? ('ACH') : ('EN'); # ('EN', 'DE', 'ES', 'FR', 'ID', 'IT', 'PL', 'PT', 'RU', 'TH', 'VI', 'JA', 'ZH_CN', 'ZH_TW');
}

sub rtl_languages {
#    return ('AR');
    return ();
}

## url_for
sub root_url {
    return '/'.(is_dev() ? 'champion-static/' : '').($BRANCH ? $BRANCH.'/' : '');
}

my %__request;
sub url_for {
    require BS::Request;
    $__request{$LANG} //= BS::Request->new(language => $LANG);
    return $__request{$LANG}->url_for(@_);
}

## tt2
sub tt2 {
    my @include_path = (root_path() . '/src/templates');

    state $request = BS::Request->new(language => $LANG);
    my $stash = Template::Stash->new({
        language    => $request->language,
        broker      => $request->broker,
        request     => $request,
        broker_name => $request->website->display_name,
        website     => $request->website,
        # 'is_pjax_request'         => $request->is_pjax,
        l                         => \&localize,
        to_monetary_number_format => \&Format::Util::Numbers::to_monetary_number_format,
    });

    my $template_toolkit = Template->new({
            ENCODING     => 'utf8',
            INCLUDE_PATH => join(':', @include_path),
            INTERPOLATE  => 1,
            PRE_CHOMP    => $Template::CHOMP_GREEDY,
            POST_CHOMP   => $Template::CHOMP_GREEDY,
            TRIM         => 1,
            STASH        => $stash,
        }) || die "$Template::ERROR\n";

    return $template_toolkit;
}

our $static_hash = join('', map{('a'..'z',0..9)[rand 36]} 0..7);
sub get_static_hash { return $static_hash; }
sub set_static_hash { $static_hash = shift; }

## css/js/menu
sub css_files {
    my @css;

    # Binary-style
    push @css, "https://style.champion-fx.com/binary.css?$static_hash";

    # if (is_dev()) {
    #     if (grep { $_ eq uc $LANG } rtl_languages()) {
    #         push @css, root_url() . "css/style_rtl.css?$static_hash";
    #     } else {
    #         push @css, root_url() . "css/style.css?$static_hash";
    #     }
    # } else {
    if (grep { $_ eq uc $LANG } rtl_languages()) {
        push @css, root_url() . "css/style_rtl.min.css?$static_hash";
    } else {
        push @css, root_url() . "css/style.min.css?$static_hash";
    }

    return @css;
}

sub js_config {
    my @libs;
    if (is_dev()) {
        push @libs, root_url . "js/bundle.js?$static_hash";
    } else {
        push @libs, root_url . "js/bundle.min.js?$static_hash";
    }

    # Binary-style-js
    push @libs, "https://style.champion-fx.com/binary.js?$static_hash";

    return {
        libs     => \@libs,
    };
}

sub menu {
    my @menu;

    push @menu,
        {
        id         => 'topMenuTrading',
        class      => 'ja-hide hide-tablet-mobile',
        url        => url_for('/trading'),
        text       => localize('Trade'),
        link_class => 'pjaxload',
        };

    # push @{$menu}, $self->_main_menu_trading();

    return \@menu;
}

1;

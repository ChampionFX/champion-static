package BS::I18N;

use feature 'state';
use strict;
use warnings;
use Path::Tiny;
use BS qw/root_path all_languages/;

my %__language_map = (
    ach   => 'ach_UG',
    en    => 'en',
    de    => 'de_DE',
    es    => 'es_ES',
    fr    => 'fr_FR',
    id    => 'id_ID',
    it    => 'it_IT',
    ja    => 'ja_JP',
    ko    => 'ko_KR',
    pl    => 'pl_PL',
    pt    => 'pt_PT',
    ru    => 'ru_RU',
    th    => 'th_TH',
    vi    => 'vi_VN',
    zh_cn => 'zh_CN',
    zh_tw => 'zh_TW',
);

sub handle_for {
    my $language = shift;

    state %handles;
    $language = $__language_map{lc $language};
    unless (exists $handles{$language}) {
        my $translation_class = _class_for();
        $handles{$language} = ${translation_class}->get_handle($language);
    }

    return $handles{$language};
}

sub _class_for {
    state %classes;
    my $rclass = "BS::I18N::binary-com";
    $rclass =~ s/\./_/g;
    $rclass =~ s/-/_/g;
    return $rclass if $classes{$rclass};

    my $config = configs_for();
    my @where = (__LINE__ + 3, __FILE__);
    eval <<EOP;    ## no critic
#line $where[0] "$where[1]"
package $rclass;
use parent 'BS::I18N::Base';
sub import_lexicons {
    my \$class = shift;
    Locale::Maketext::Lexicon->import(\@_);
}
EOP
    ${rclass}->import_lexicons($config);
    $classes{$rclass}++;
    return $rclass;
}

sub configs_for {
    my $config = {};

    my $locales_dir = path(root_path())->child('src')->child('translations');
    warn("Unable to locate locales directory. Looking in $locales_dir") unless (-d $locales_dir);

    my @supported_languages = (all_languages(), 'ACH');
    foreach my $language (@supported_languages) {
        my $l = $__language_map{lc $language};
        my $po_file_path = path($locales_dir)->child($l . '.po');
        $config->{$l} = [Gettext => "$po_file_path"];
    }

    $config->{_auto}   = 1;
    $config->{_decode} = 1;

    return $config;
}

1;

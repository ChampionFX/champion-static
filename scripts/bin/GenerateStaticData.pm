package GenerateStaticData;

use strict;
use warnings;
use v5.10;

use JSON qw(to_json);
use File::Slurp;
use YAML::XS qw(LoadFile);
# our module in lib
use BS;

sub generate_data_files {
    my $js_path = shift;

    _make_nobody_dir($js_path);
    print "\tGenerating $js_path/texts.js\n";
    my $exports = <<'END_EXPORTS';

module.exports = {
    texts_json: texts_json,
};
END_EXPORTS

    File::Slurp::write_file("$js_path/texts.js", {binmode => ':utf8'}, _texts() . $exports);
    return;
}

sub _texts {
    my $js = "var texts_json = {};\n";
    foreach my $language ((BS::all_languages(), 'ACH')) {
        BS::set_lang($language);

        my @texts;
        # global error messages
        push @texts, localize('This field is required');
        push @texts, localize('Invalid email address');
        push @texts, localize('Password should have lower and uppercase letters with numbers.');
        push @texts, localize('You should enter [_1] characters.');
        push @texts, localize('Minimum of [_1] characters required.');
        push @texts, localize('The two passwords that you entered do not match.');
        push @texts, localize('Only letters, space, hyphen, period, apost are allowed.');
        push @texts, localize('Only letters, numbers, hyphen are allowed.');
        push @texts, localize('Only numbers, space are allowed.');
        push @texts, localize('Please input a valid date');

        # new virtual account
        push @texts, localize('Please submit a valid verification token.');

        # new real account
        push @texts, localize('Day');
        push @texts, localize('Month');
        push @texts, localize('Year');
        push @texts, localize('Jan');
        push @texts, localize('Feb');
        push @texts, localize('Mar');
        push @texts, localize('Apr');
        push @texts, localize('May');
        push @texts, localize('Jun');
        push @texts, localize('Jul');
        push @texts, localize('Aug');
        push @texts, localize('Sep');
        push @texts, localize('Oct');
        push @texts, localize('Nov');
        push @texts, localize('Dec');

        my %as_hash = @texts;
        $js .= "texts_json['" . $language . "'] = " . JSON::to_json(\%as_hash) . ";\n";
    }

    return $js;
}

sub _make_nobody_dir {
    my $dir  = shift;
    if (not -d $dir) {
        mkdir $dir;
    }

    my ($login, $pass, $uid, $gid) = getpwnam("nobody");
    chown($uid, $gid, $dir);
    return;
}

sub localize {
    my $text = shift;

    my $translated = BS::localize($text, '[_1]', '[_2]', '[_3]', '[_4]');
    if ($text eq $translated) {    #Not Translated.
        return;
    }
    $text =~ s/[\s.]/_/g;
    return ($text, $translated);
}

1;

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
        push @texts, localize('[_1] and [_2] cannot be the same.');
        push @texts, localize('Only letters, numbers, space, hyphen, period, and apostrophe are allowed.');
        push @texts, localize('Only letters, space, hyphen, period, and apostrophe are allowed.');
        push @texts, localize('Only letters, numbers, and hyphen are allowed.');
        push @texts, localize('Only numbers and spaces are allowed.');
        push @texts, localize('Only letters, numbers, space, and these special characters are allowed: - . \' # ; : ( ) , @ /');
        push @texts, localize('Please input a valid date');
        push @texts, localize('Should be a valid number');
        push @texts, localize('Should be more than [_1]');
        push @texts, localize('Should be less than [_1]');
        push @texts, localize('This feature is not relevant to virtual-money accounts.');

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

        # change password
        push @texts, localize('Please <a href="[_1]">log in</a> to view this page.');
        push @texts, localize('Your password has been changed. Please log in again.');

        # reset password
        push @texts, localize('[_1] Please click the link below to restart the password recovery process. If you require further assistance, please contact our Customer Support.');
        push @texts, localize('Your password has been successfully reset. Please log into your account using your new password.');

        # metatrader
        push @texts, localize('Congratulations! Your [_1] Account has been created.');
        push @texts, localize('The main password of account number [_1] has been changed.');
        push @texts, localize('[_1] deposit from [_2] to account number [_3] is done. Transaction ID: [_4]');
        push @texts, localize('[_1] withdrawal from account number [_2] to [_3] is done. Transaction ID: [_4]');
        push @texts, localize('Your cashier is locked as per your request - to unlock it, please click <a href="[_1]">here</a>.');

        # date_picker
        push @texts, localize('January');
        push @texts, localize('February');
        push @texts, localize('March');
        push @texts, localize('April');
        push @texts, localize('May');
        push @texts, localize('June');
        push @texts, localize('July');
        push @texts, localize('August');
        push @texts, localize('September');
        push @texts, localize('October');
        push @texts, localize('November');
        push @texts, localize('December');
        push @texts, localize('Sunday');
        push @texts, localize('Monday');
        push @texts, localize('Tuesday');
        push @texts, localize('Wednesday');
        push @texts, localize('Thursday');
        push @texts, localize('Friday');
        push @texts, localize('Saturday');
        push @texts, localize('Su');
        push @texts, localize('Mo');
        push @texts, localize('Tu');
        push @texts, localize('We');
        push @texts, localize('Th');
        push @texts, localize('Fr');
        push @texts, localize('Sa');
        push @texts, localize('Next');
        push @texts, localize('Previous');

        # cashier
        push @texts, localize('[_1] [_2] has been credited to your Virtual money account [_3]');
        push @texts, localize('Sorry, this feature is available to virtual accounts only.');
        push @texts, localize('Your settings have been updated successfully.');
        push @texts, localize('Please accept the latest Terms and Conditions.');

        # financial assessment
        push @texts, localize('You did not change anything.');
        push @texts, localize('Sorry, an error occurred while processing your request.');
        push @texts, localize('Your changes have been updated successfully.');

        # header notification
        push @texts, localize('Please [_1]authenticate your account[_2] to lift your withdrawal and trading limits.');
        push @texts, localize('Please complete the [_1]financial assessment form[_2] to lift your withdrawal and trading limits.');
        push @texts, localize('Please [_1]complete your account profile[_2] to lift your withdrawal and trading limits.');
        push @texts, localize('Please [_1]accept the updated Terms and Conditions[_2] to lift your withdrawal and trading limits.');
        push @texts, localize('Your account is restricted. Kindly [_1]contact customer support[_2] for assistance.');

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

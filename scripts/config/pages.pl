#!/usr/bin/perl

use strict;
use warnings;

sub all_pages {
    return (
        # url pathname,                template file path,             layout,       title,                  exclude languages
        ['home',                       'static/home',                  'full_width', 'Champion FX'],
        ['404',                        'static/404',                   'full_width', '404'],
        ['about-us',                   'static/about',                 'full_width', 'About Us'],
        ['contact',                    'static/contact',               'full_width', 'Contact Us'],
        ['binary-options',             'static/binary_options',        'full_width', 'Binary Options'],
        ['forex',                      'static/forex',                 'full_width', 'Forex'],
        ['licensing',                  'static/licensing',             'full_width', 'Licensing'],
        ['mission',                    'static/mission',               'full_width', 'Mission'],
        ['range-of-markets',           'static/range_of_markets',      'full_width', 'Range of Markets'],
        ['trading',                    'static/trading',               'full_width', 'Trading'],
        ['why-mt5',                    'static/why_mt5',               'full_width', 'Why MT5'],
        ['endpoint',                   'static/endpoint',              'full_width', 'Endpoint'],
        ['logged_inws',                'static/common/logged_in',      'full_width', 'Logging in...'],
        ['partnerships',               'static/partnerships',          'full_width', 'Partnerships'],
#       ['other-markets',              'static/other_markets',         'full_width', 'Other Markets'],
        ['lost-password',              'static/lost_password',         'full_width', 'Password Reset'],
        ['reset-password',             'static/reset_password',        'full_width', 'Password Reset'],

        ['terms-and-conditions',       'legal/tac',                    'full_width', 'Terms and Conditions'],

        ['new-account/virtual',        'new_account/virtual',          'full_width', 'Create new virtual account'],
        ['new-account/real',           'new_account/real',             'full_width', 'Create new real account'],

        ['user/settings',              'user/settings',                'full_width', 'Settings'],
        ['user/change-password',       'user/change_password',         'full-width', 'Change Password'],
        ['user/tnc-approval',          'user/tnc_approval',            'full_width', 'Terms and Conditions Approval'],
        ['user/assessment',            'user/financial_assessment',    'full_width', 'Financial Assessment'],

        ['cashier',                    'cashier/cashier',              'full_width', 'Cashier'],
        ['cashier/payment-methods',    'cashier/payment_methods',      'full_width', 'Payment Methods'],
        ['cashier/top-up-virtual',     'cashier/top_up_virtual',       'full_width', 'Give Me More Money!'],
        ['cashier/cashier-password',   'cashier/cashier_password',     'full_width', 'Cashier Password'],

        ['cashier/deposit-withdrawal',            'cashier/deposit_withdrawal',   'full_width', 'Deposit'],
    );
}

1;

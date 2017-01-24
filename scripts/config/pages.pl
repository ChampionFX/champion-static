#!/usr/bin/perl

use strict;
use warnings;

sub all_pages {
    return (
        # url pathname,                template file path,             layout,       title,                  exclude languages
        ['404',                        'static/404',                   'full_width', '404'],
        ['about-us',                   'static/about',                 'full_width', 'About Us'],
        ['binary-options',             'static/binary_options',        'full_width', 'Binary Options'],
        ['contact',                    'static/contact',               'full_width', 'Contact Us'],
        ['endpoint',                   'static/endpoint',              'full_width', 'Endpoint'],
        ['forex',                      'static/forex',                 'full_width', 'Forex'],
        ['home',                       'static/home',                  'full_width', 'Champion FX'],
        ['licensing',                  'static/licensing',             'full_width', 'Licensing'],
        ['logged_inws',                'static/common/logged_in',      'full_width', 'Logging in...'],
        ['lost-password',              'static/lost_password',         'full_width', 'Password Reset'],
        ['mission',                    'static/mission',               'full_width', 'Mission'],
#       ['other-markets',              'static/other_markets',         'full_width', 'Other Markets'],
        ['partnerships',               'static/partnerships',          'full_width', 'Partnerships'],
        ['range-of-markets',           'static/range_of_markets',      'full_width', 'Range of Markets'],
        ['reset-password',             'static/reset_password',        'full_width', 'Password Reset'],
        ['trading',                    'static/trading',               'full_width', 'Trading'],
        ['why-mt5',                    'static/why_mt5',               'full_width', 'Why MT5'],

        ['terms-and-conditions',       'legal/tac',                    'full_width', 'Terms and Conditions'],

        ['cashier',                    'cashier/cashier',              'full_width', 'Cashier'],
        ['cashier/cashier-password',   'cashier/cashier_password',     'full_width', 'Cashier Password'],
        ['cashier/payment-methods',    'cashier/payment_methods',      'full_width', 'Payment Methods'],
        ['cashier/top-up-virtual',     'cashier/top_up_virtual',       'full_width', 'Give Me More Money!'],

        ['new-account/real',           'new_account/real',             'full_width', 'Create new real account'],
        ['new-account/virtual',        'new_account/virtual',          'full_width', 'Create new virtual account'],

        ['user/assessment',            'user/financial_assessment',    'full_width', 'Financial Assessment'],
        ['user/change-password',       'user/change_password',         'full-width', 'Change Password'],
        ['user/metatrader',            'user/metatrader',              'full-width', 'MetaTrader account management'],
        ['user/settings',              'user/settings',                'full_width', 'Settings'],
        ['user/tnc-approval',          'user/tnc_approval',            'full_width', 'Terms and Conditions Approval'],
        
        ['cashier/deposit-withdrawal',            'cashier/deposit_withdrawal',   'full_width', 'Deposit'],
    );
}

1;

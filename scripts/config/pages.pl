#!/usr/bin/perl

use strict;
use warnings;

sub all_pages {
    return (
        # url pathname,                template file path,             layout,       title,                  exclude languages
        ['404',                        'static/404',                   'full_width', '404'],
        ['about-us',                   'static/about',                 'full_width', 'About Us'],
        ['contact',                    'static/contact',               'full_width', 'Contact Us'],
        ['endpoint',                   'static/endpoint',              'full_width', 'Endpoint'],
        ['home',                       'static/home',                  'full_width', 'Champion FX'],
        ['licensing',                  'static/licensing',             'full_width', 'Licensing'],
        ['logged_inws',                'static/common/logged_in',      'full_width', 'Logging in...'],
        ['lost-password',              'static/lost_password',         'full_width', 'Password Reset'],
        ['mission',                    'static/mission',               'full_width', 'Mission'],
#       ['other-markets',              'static/other_markets',         'full_width', 'Other Markets'],
        ['range-of-markets',           'static/range_of_markets',      'full_width', 'Range of Markets'],
        ['reset-password',             'static/reset_password',        'full_width', 'Password Reset'],
        ['trading',                    'static/trading',               'full_width', 'Trading'],
        ['why-mt5',                    'static/why_mt5',               'full_width', 'Why MT5'],
        ['trading-times',              'static/trading_times',         'full_width', 'Trading Times'],

        ['binary-options',             'static/binary_options/binary_options',    'full_width', 'Binary Options'],
        ['what-is-binary-options',     'static/binary_options/what_is',           'full_width', 'What is binary options trading'],
        ['types-of-accounts',          'static/binary_options/types_of_accounts', 'full_width', 'Binary options trading accounts'],
        ['how-to-trade-binary-options','static/binary_options/how_to',            'full_width', 'How to trade binary options'],

        ['forex',                      'mt5/forex/index',              'full_width', 'Forex'],
        ['forex/accounts/cent',        'mt5/forex/accounts/cent',      'full_width', 'Cent Account'],
        ['forex/accounts/standard',    'mt5/forex/accounts/standard',  'full_width', 'Standard Account'],
        ['forex/accounts/stp',         'mt5/forex/accounts/stp',       'full_width', 'STP Account'],
        ['cfd',                        'mt5/cfd',                      'full_width', 'Contracts for Difference'],
        ['metals',                     'mt5/metals',                   'full_width', 'Metals'],

        ['partnerships',               'static/partnerships/partnerships',             'full_width', 'Partnerships'],
        ['partnerships-affiliate',     'static/partnerships/partnerships_affiliate',   'full_width', 'Affiliate programme'],
        ['partnerships-contributor',   'static/partnerships/partnerships_contributor', 'full_width', 'Content Contributor programme'],
        ['partnerships-ib',            'static/partnerships/partnerships_ib',          'full_width', 'Introducing Broker'],

        ['terms-and-conditions',       'legal/tac',                    'full_width', 'Terms and Conditions'],

        ['cashier',                    'cashier/cashier',              'full_width', 'Cashier'],
        ['cashier/cashier-password',   'cashier/cashier_password',     'full_width', 'Cashier Password'],
        ['cashier/forward',            'cashier/deposit_withdraw',     'full_width', 'Cashier'],
        ['cashier/payment-methods',    'cashier/payment_methods',      'full_width', 'Payment Methods'],
        ['cashier/top-up-virtual',     'cashier/top_up_virtual',       'full_width', 'Give Me More Money!'],

        ['new-account/real',           'new_account/real',             'full_width', 'Create new real account'],
        ['new-account/virtual',        'new_account/virtual',          'full_width', 'Create new virtual account'],

        ['trading-platform',                 'static/trading_platform/trading_platform', 'full_width', 'Trading Platforms'],
        ['trading-platform/metatrader-5',    'static/trading_platform/metatrader_5',     'full_width', 'MetaTrader5'],
        ['trading-platform/champion-trader', 'static/trading_platform/champion_trader',  'full_width', 'Champion Trader'],
        ['trading-platform/mt5-vs-mt4',      'static/trading_platform/mt5_vs_mt4',       'full_width', 'MetaTrader5 vs MetaTrader4'],

        # ['user/assessment',            'user/financial_assessment',    'full_width', 'Financial Assessment'],
        # ['user/details',               'user/personal_details',        'full_width', 'Personal Details'],
        ['user/authenticate',          'user/authenticate',            'full_width', 'Authenticate', 'ja'],
        ['user/change-password',       'user/change_password',         'full-width', 'Change Password'],
        ['user/limits',                'user/limits',                  'full_width', 'Account Limits'],
        ['user/login-history',         'user/login_history',           'full_width', 'Login History'],
        ['user/metatrader',            'user/metatrader',              'full-width', 'MetaTrader account management'],
        ['user/profile',               'user/profile',                 'full_width', 'Profile'],
        ['user/security',              'user/security',                'full_width', 'Security'],
        ['user/settings',              'user/settings',                'full_width', 'Settings'],
        ['user/tnc-approval',          'user/tnc_approval',            'full_width', 'Terms and Conditions Approval'],

    );
}

1;

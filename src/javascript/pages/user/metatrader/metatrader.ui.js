const Validation       = require('../../../common/validation');
const MetaTraderConfig = require('./metatrader.config');

const MetaTraderUI = (function() {
    'use strict';

    let $container,
        $list,
        $action,
        $templates,
        $form,
        submit;

    const hidden_class  = 'hidden';

    const types_info   = MetaTraderConfig.types_info;
    const actions_info = MetaTraderConfig.actions_info;
    // const fields       = MetaTraderConfig.fields;
    const validations  = MetaTraderConfig.validations;

    const init = (submit_func) => {
        submit = submit_func;
        $container = $('#mt_account_management');
        $list      = $container.find('#accounts_list');
        $action    = $container.find('#fst_action');
        $templates = $container.find('#templates');

        populateAccountList();
    };

    const populateAccountList = () => {
        const $acc_box = $templates.find('> .acc-box');
        Object.keys(types_info).forEach(function(acc_type) {
            if ($list.find(`#${acc_type}`).length === 0) {
                const $acc_item = $acc_box.clone();

                // set values
                $acc_item.attr('id', acc_type);
                $acc_item.find('.title').text(types_info[acc_type].title);

                // display either account details or sign up button
                $acc_item.find(`.${types_info[acc_type].account_info ? 'no' : 'has'}-account`).removeClass(hidden_class);
                $acc_item.find('.loading').remove();

                // exceptions for demo account
                if (types_info[acc_type].is_demo) {
                    $acc_item.find('.act_deposit, .act_withdrawal').remove();
                }
                $list.append($acc_item);
            }
        });
        $list.find('[class*="act_"]').click(populateForm);
        $action.find('.close').click(closeForm);
    };

    const populateForm = (e) => {
        const acc_type = $(e.target).parents('.acc-box').attr('id');
        const action = $(e.target).attr('class').match(/act_(.*)/)[1];

        // set active
        $list.find(`.acc-box[id!="${acc_type}"] > div`).removeClass('active');
        $list.find(`#${acc_type} > div`).addClass('active');

        // clone form, event listener
        $form = $templates.find(`#frm_${action}`).clone();
        const formValues = actions_info[action].formValues;
        if (formValues) formValues($form, acc_type, action);
        $form.find('#btn_submit').attr({ acc_type: acc_type, action: action }).on('click dblclick', submit);

        // update legend, append form
        $action.find('legend').text(`${types_info[acc_type].title}: ${actions_info[action].title}`).end()
            .find('#frm_action')
            .html($form)
            .end()
            .removeClass(hidden_class);

        Validation.init(`#frm_${action}`, validations[action]);
    };

    const closeForm = () => {
        if ($form.length) {
            $form.find('#btn_submit').off('click dblclick', submit);
            $form.empty();
            $form = undefined;
            $action.addClass(hidden_class);
            $list.find('.acc-box > div').removeClass('active');
        }
    };

    return {
        init               : init,
        populateAccountList: populateAccountList,
        populateForm       : populateForm,
        closeForm          : closeForm,
        $form              : () => $form,
    };
})();

module.exports = MetaTraderUI;

const RiskClassification  = require('./risk_classification');
const FinancialAssessment = require('./financial_assessment');
const Client              = require('../../common/client');
const url_for             = require('../../common/url').url_for;
const ChampionSocket      = require('../../common/socket');

const renderRiskClassificationPopUp = () => {
    if (window.location.pathname === '/user/assessment') {
        window.location.href = url_for('user/settings');
        return;
    }
    $.ajax({
        url     : url_for('user/assessment'),
        dataType: 'html',
        method  : 'GET',
        success : function(riskClassificationText) {
            if (riskClassificationText.includes('assessment_form')) {
                const payload = $(riskClassificationText);
                RiskClassification.showRiskClassificationPopUp(payload.find('#assessment_form'));
                const $risk_classification = $('#risk_classification');
                $risk_classification.find('#assessment_form').removeClass('invisible')
                    .attr('style', 'text-align: left;');
                $risk_classification.find('#high_risk_classification').removeClass('invisible');
                $risk_classification.find('#heading_risk').removeClass('invisible');
                handleForm($risk_classification);
            }
        },
        error: function() {
            return false;
        },
    });
    handleForm($('#risk_classification'));
};

const handleForm = ($risk_classification) => {
    FinancialAssessment.handleForm();
    $risk_classification.find('#assessment_form').on('submit', function(event) {
        event.preventDefault();
        FinancialAssessment.submitForm();
        return false;
    });
};

const checkRiskClassification = () => {
    ChampionSocket.wait('get_account_status').then((response_account_status) => {
        if (response_account_status.get_account_status && response_account_status.get_account_status.risk_classification === 'high') {
            ChampionSocket.send({ get_financial_assessment: 1 }).then((response_financial_assessment) => {
                if (!response_financial_assessment.get_financial_assessment && !Client.is_virtual()) {
                    renderRiskClassificationPopUp();
                }
            });
        }
    });
};

module.exports = checkRiskClassification;

import React from "react";

import { SlippiOnlineRules } from "@/components/slippi_online_rules/slippi_online_rules";
import { SlippiUsagePolicyList } from "@/components/slippi_usage_policy_list/slippi_usage_policy_list";

import { RulesAndPoliciesPageMessages as Messages } from "./rules_and_policies_page.messages";

export const RulesAndPoliciesPage = React.memo(() => {
  return (
    <div>
      <h1>{Messages.rulesAndPolicies()}</h1>
      <SlippiOnlineRules />
      <SlippiUsagePolicyList />
    </div>
  );
});

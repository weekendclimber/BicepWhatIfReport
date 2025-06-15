## Resource: sec-test-rg


 - **Change Type**: NoChange
 - **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg
 - **After Type**: Microsoft.Resources/resourceGroups
     - Before Type: Microsoft.Resources/resourceGroups

 - **Location**: westus2

## Resource: sec-ubuntu-test-osdisk-001


 - **Change Type**: Ignore
 - **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/SEC-TEST-RG/providers/Microsoft.Compute/disks/sec-ubuntu-test-osdisk-001
 - **After Type**: Microsoft.Compute/disks
     - Before Type: Microsoft.Compute/disks

 - **Location**: westus2

## Diagnostic: NestedDeploymentShortCircuited


 - **Level**: Warning
 - **Message**: A nested deployment got short-circuited and all its resources got skipped from validation. This is due to a nested template having a parameter that was not fully evaluated (e.g. contains a reference() function). Please see https://aka.ms/WhatIfEvalStopped for more guidance.
 - **Target**: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Resources/deployments/opp-hub-vnet-to-sec-test-vnet-001

## Diagnostic: NestedDeploymentShortCircuited


 - **Level**: Warning
 - **Message**: A nested deployment got short-circuited and all its resources got skipped from validation. This is due to a nested template having a parameter that was not fully evaluated (e.g. contains a reference() function). Please see https://aka.ms/WhatIfEvalStopped for more guidance.
 - **Target**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/test-firewall/providers/Microsoft.Resources/deployments/SecurityVMRuleCollectionGroup
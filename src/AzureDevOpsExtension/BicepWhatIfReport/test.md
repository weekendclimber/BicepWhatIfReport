# Bicep What-If Report
## Resource Name: sec-test-rg
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg
### Change Type: NoChange
 - **Name**: **sec-test-rg**
 - Type: Microsoft.Resources/resourceGroups
 - Location: westus2
 - API Version: 2025-03-01
## Resource Name: sec-ubuntu-test-osdisk-001
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/SEC-TEST-RG/providers/Microsoft.Compute/disks/sec-ubuntu-test-osdisk-001
### Change Type: Ignore
 - **Name**: **sec-ubuntu-test-osdisk-001**
 - Type: Microsoft.Compute/disks
 - Resource Group: SEC-TEST-RG
 - Location: westus2
 - API Version: Unknown API Version
### Details
 - After: 
     - id: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/SEC-TEST-RG/providers/Microsoft.Compute/disks/sec-ubuntu-test-osdisk-001
     - location: westus2
     - managedBy: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Compute/virtualMachines/sec-ubuntu-test-vm-001
     - name: sec-ubuntu-test-osdisk-001
     - resourceGroup: SEC-TEST-RG
     - sku: 
         - name: Standard_LRS
         - tier: Standard
     - type: Microsoft.Compute/disks
     - zones: 1
## Resource Name: sec-ubuntu-test-vm-001
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Compute/virtualMachines/sec-ubuntu-test-vm-001
### Change Type: Modify
 - **Name**: **sec-ubuntu-test-vm-001**
 - Type: Microsoft.Compute/virtualMachines
 - Resource Group: sec-test-rg
 - Location: westus2
 - API Version: 2024-07-01
### Change Details
 - **Resource Type**: identity
     - Change Type: Delete
         - After: null
         - Before: 
             - type: SystemAssigned
 - **Resource Type**: properties.osProfile.adminUsername
     - Change Type: Modify
         - After: *******
         - Before: azuresecadmin
 - **Resource Type**: properties.storageProfile.osDisk.diskSizeGB
     - Change Type: Create
         - After: 128
         - Before: null
 - **Resource Type**: properties.storageProfile.osDisk.managedDisk.storageAccountType
     - Change Type: NoEffect
         - After: Standard_LRS
         - Before: null
## Resource Name: sec-ubuntu-test-vm-001/AzurePolicyforLinux
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Compute/virtualMachines/sec-ubuntu-test-vm-001/extensions/AzurePolicyforLinux
### Change Type: Ignore
 - **Name**: **sec-ubuntu-test-vm-001/AzurePolicyforLinux**
 - Type: Microsoft.Compute/virtualMachines/extensions
 - Resource Group: sec-test-rg
 - Location: westus2
 - API Version: Unknown API Version
### Details
 - After: 
     - id: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Compute/virtualMachines/sec-ubuntu-test-vm-001/extensions/AzurePolicyforLinux
     - location: westus2
     - name: sec-ubuntu-test-vm-001/AzurePolicyforLinux
     - resourceGroup: sec-test-rg
     - type: Microsoft.Compute/virtualMachines/extensions
## Resource Name: sec-ubuntu-test-vm-001/MDE.Linux
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/SEC-TEST-RG/providers/Microsoft.Compute/virtualMachines/sec-ubuntu-test-vm-001/extensions/MDE.Linux
### Change Type: Ignore
 - **Name**: **sec-ubuntu-test-vm-001/MDE.Linux**
 - Type: Microsoft.Compute/virtualMachines/extensions
 - Resource Group: SEC-TEST-RG
 - Location: westus2
 - API Version: Unknown API Version
### Details
 - After: 
     - id: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/SEC-TEST-RG/providers/Microsoft.Compute/virtualMachines/sec-ubuntu-test-vm-001/extensions/MDE.Linux
     - location: westus2
     - name: sec-ubuntu-test-vm-001/MDE.Linux
     - resourceGroup: SEC-TEST-RG
     - type: Microsoft.Compute/virtualMachines/extensions
## Resource Name: sec-test-dest-ipg-001
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Network/ipGroups/sec-test-dest-ipg-001
### Change Type: NoChange
 - **Name**: **sec-test-dest-ipg-001**
 - Type: Microsoft.Network/ipGroups
 - Resource Group: sec-test-rg
 - Location: westus2
 - API Version: 2024-05-01
### Details
 - ipAddresses: 10.252.32.0/19
## Resource Name: sec-ubuntu-test-nic-001
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Network/networkInterfaces/sec-ubuntu-test-nic-001
### Change Type: Modify
 - **Name**: **sec-ubuntu-test-nic-001**
 - Type: Microsoft.Network/networkInterfaces
 - Resource Group: sec-test-rg
 - Location: westus2
 - API Version: 2024-05-01
### Change Details
 - **Resource Type**: kind
     - Change Type: Delete
         - After: null
         - Before: Regular
 - **Resource Type**: properties.allowPort25Out
     - Change Type: Delete
         - After: null
         - Before: true
 - **Resource Type**: properties.ipConfigurations
     - Change Type: Array
         - After: null
         - Before: null
     - **Child Resource(s)**:
         - **Resource Type**: properties.ipConfigurations[0]
             - Change Type: Modify
                 - After: null
                 - Before: null
             - **Child Resource(s)**:
                 - **Resource Type**: properties.ipConfigurations[0].properties.privateIPAddress
                     - Change Type: Delete
                         - After: null
                         - Before: 10.168.1.4
 - **Resource Type**: properties.ipConfigurations[0].properties.loadBalancerBackendAddressPools
     - Change Type: NoEffect
         - After: null
         - Before: null
 - **Resource Type**: properties.ipConfigurations[0].properties.loadBalancerInboundNatRules
     - Change Type: NoEffect
         - After: null
         - Before: null
 - **Resource Type**: properties.ipConfigurations[0].properties.primary
     - Change Type: NoEffect
         - After: true
         - Before: null
## Resource Name: sec-vm-snet-rt-001
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Network/routeTables/sec-vm-snet-rt-001
### Change Type: NoChange
 - **Name**: **sec-vm-snet-rt-001**
 - Type: Microsoft.Network/routeTables
 - Resource Group: sec-test-rg
 - Location: westus2
 - API Version: 2023-04-01
### Details
 - disableBgpRoutePropagation: false
 - routes: 
     - Item 1: 
         - name: default
         - properties: 
             - addressPrefix: 0.0.0.0/0
             - nextHopIpAddress: 10.252.0.196
             - nextHopType: VirtualAppliance
## Resource Name: sec-test-vnet-001
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Network/virtualNetworks/sec-test-vnet-001
### Change Type: Modify
 - **Name**: **sec-test-vnet-001**
 - Type: Microsoft.Network/virtualNetworks
 - Resource Group: sec-test-rg
 - Location: westus2
 - API Version: 2024-05-01
### Change Details
 - **Resource Type**: properties.privateEndpointVNetPolicies
     - Change Type: Delete
         - After: null
         - Before: Disabled
 - **Resource Type**: properties.virtualNetworkPeerings
     - Change Type: Array
         - After: null
         - Before: null
     - **Child Resource(s)**:
         - **Resource Type**: properties.virtualNetworkPeerings[0]
             - Change Type: Modify
                 - After: null
                 - Before: null
             - **Child Resource(s)**:
                 - **Resource Type**: properties.virtualNetworkPeerings[0].properties.doNotVerifyRemoteGateways
                     - Change Type: Modify
                         - After: true
                         - Before: false
                 - **Resource Type**: properties.virtualNetworkPeerings[0].properties.peerCompleteVnets
                     - Change Type: Delete
                         - After: null
                         - Before: true
                 - **Resource Type**: properties.virtualNetworkPeerings[0].properties.peeringSyncLevel
                     - Change Type: Delete
                         - After: null
                         - Before: FullyInSync
                 - **Resource Type**: properties.virtualNetworkPeerings[0].properties.remoteAddressSpace
                     - Change Type: Delete
                         - After: null
                         - Before: 
                             - addressPrefixes: 
                                 - Item 1: 10.252.0.0/19
                                 - Item 2: 10.251.0.0/19
                                 - Item 3: 10.252.0.0/19
                 - **Resource Type**: properties.virtualNetworkPeerings[0].properties.remoteGateways
                     - Change Type: Delete
                         - After: null
                         - Before: 
                             - Item 1: 
                                 - id: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Network/virtualNetworkGateways/opp-hub-vpngw1
                                 - resourceGroup: opp-hub-rg
                             - Item 2: 
                                 - id: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Network/virtualNetworkGateways/opp-hub-vpngw1
                                 - resourceGroup: opp-hub-rg
                             - Item 3: 
                                 - id: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Network/virtualNetworkGateways/opp-hub-vpngw1
                                 - resourceGroup: opp-hub-rg
                 - **Resource Type**: properties.virtualNetworkPeerings[0].properties.remoteVirtualNetworkAddressSpace
                     - Change Type: Delete
                         - After: null
                         - Before: 
                             - addressPrefixes: 10.252.0.0/19
 - **Resource Type**: properties.subnets[0].type
     - Change Type: NoEffect
         - After: Microsoft.Network/virtualNetworks/subnets
         - Before: null
 - **Resource Type**: properties.virtualNetworkPeerings[0].type
     - Change Type: NoEffect
         - After: Microsoft.Network/virtualNetworks/virtualNetworkPeerings
         - Before: null
## Resource Name: sec-vm-snet-001
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Network/virtualNetworks/sec-test-vnet-001/subnets/sec-vm-snet-001
### Change Type: Modify
 - **Name**: **sec-vm-snet-001**
 - Type: Microsoft.Network/virtualNetworks/subnets
 - Resource Group: sec-test-rg
 - Location: Unknown Location
 - API Version: 2024-05-01
### Change Details
 - **Resource Type**: properties.privateEndpointNetworkPolicies
     - Change Type: Modify
         - After: Enabled
         - Before: Disabled
## Resource Name: sec-test-vnet-001-to-opp-hub-vnet
> **Resource ID**: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/sec-test-rg/providers/Microsoft.Network/virtualNetworks/sec-test-vnet-001/virtualNetworkPeerings/sec-test-vnet-001-to-opp-hub-vnet
### Change Type: Modify
 - **Name**: **sec-test-vnet-001-to-opp-hub-vnet**
 - Type: Microsoft.Network/virtualNetworks/virtualNetworkPeerings
 - Resource Group: sec-test-rg
 - Location: Unknown Location
 - API Version: 2024-01-01
### Change Details
 - **Resource Type**: properties.doNotVerifyRemoteGateways
     - Change Type: Modify
         - After: true
         - Before: false
 - **Resource Type**: properties.peerCompleteVnets
     - Change Type: Delete
         - After: null
         - Before: true
 - **Resource Type**: properties.peeringSyncLevel
     - Change Type: Delete
         - After: null
         - Before: FullyInSync
 - **Resource Type**: properties.remoteAddressSpace
     - Change Type: Delete
         - After: null
         - Before: 
             - addressPrefixes: 
                 - Item 1: 10.252.0.0/19
                 - Item 2: 10.252.0.0/19
                 - Item 3: 10.252.0.0/19
 - **Resource Type**: properties.remoteGateways
     - Change Type: Delete
         - After: null
         - Before: 
             - Item 1: 
                 - id: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Network/virtualNetworkGateways/opp-hub-vpngw1
                 - resourceGroup: opp-hub-rg
             - Item 2: 
                 - id: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Network/virtualNetworkGateways/opp-hub-vpngw1
                 - resourceGroup: opp-hub-rg
             - Item 3: 
                 - id: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Network/virtualNetworkGateways/opp-hub-vpngw1
                 - resourceGroup: opp-hub-rg
 - **Resource Type**: properties.remoteVirtualNetworkAddressSpace
     - Change Type: Delete
         - After: null
         - Before: 
             - addressPrefixes: 10.252.0.0/19
## Resource Name: sec-prod-rg
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg
### Change Type: Create
 - **Name**: **sec-prod-rg**
 - Type: Microsoft.Resources/resourceGroups
 - Location: westus2
 - API Version: 2025-03-01
## Resource Name: sec-ubuntu-prod-vm-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Compute/virtualMachines/sec-ubuntu-prod-vm-001
### Change Type: Create
 - **Name**: **sec-ubuntu-prod-vm-001**
 - Type: Microsoft.Compute/virtualMachines
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2024-07-01
### New Resource Details
 - additionalCapabilities: 
     - hibernationEnabled: false
     - ultraSSDEnabled: false
 - diagnosticsProfile: 
     - bootDiagnostics: 
         - enabled: false
 - hardwareProfile: 
     - vmSize: Standard_B4als_v2
 - networkProfile: 
     - networkInterfaces: [object Object]
 - osProfile: 
     - adminPassword: *******
     - adminUsername: *******
     - allowExtensionOperations: true
     - computerName: sec-ubuntu-prod-vm-001
     - customData: *******
     - linuxConfiguration: 
         - disablePasswordAuthentication: false
         - provisionVMAgent: true
 - securityProfile: 
     - encryptionAtHost: true
 - storageProfile: 
     - imageReference: 
         - offer: 0001-com-ubuntu-server-jammy
         - publisher: Canonical
         - sku: 22_04-lts-gen2
         - version: latest
     - osDisk: 
         - caching: ReadOnly
         - createOption: FromImage
         - deleteOption: Delete
         - diskSizeGB: 128
         - name: sec-ubuntu-prod-osdisk-001
 - userData: *******
## Resource Name: sec-prod-dest-ipg-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/ipGroups/sec-prod-dest-ipg-001
### Change Type: Create
 - **Name**: **sec-prod-dest-ipg-001**
 - Type: Microsoft.Network/ipGroups
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2024-05-01
### New Resource Details
 - ipAddresses: 10.252.32.0/19
## Resource Name: sec-ubuntu-prod-nic-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/networkInterfaces/sec-ubuntu-prod-nic-001
### Change Type: Create
 - **Name**: **sec-ubuntu-prod-nic-001**
 - Type: Microsoft.Network/networkInterfaces
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2024-05-01
### New Resource Details
 - auxiliaryMode: None
 - auxiliarySku: None
 - disableTcpStateTracking: false
 - enableAcceleratedNetworking: true
 - enableIPForwarding: false
 - ipConfigurations: 
     - Item 1: 
         - name: sec-ubuntu-prod-ipconfig-001
         - properties: 
             - privateIPAddressVersion: IPv4
             - privateIPAllocationMethod: Dynamic
             - subnet: 
                 - id: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/virtualNetworks/sec-prod-vnet-001/subnets/sec-vm-snet-001
                 - resourceGroup: sec-prod-rg
## Resource Name: sec-vm-snet-rt-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/routeTables/sec-vm-snet-rt-001
### Change Type: Create
 - **Name**: **sec-vm-snet-rt-001**
 - Type: Microsoft.Network/routeTables
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2023-04-01
### New Resource Details
 - disableBgpRoutePropagation: false
 - routes: 
     - Item 1: 
         - name: default
         - properties: 
             - addressPrefix: 0.0.0.0/0
             - nextHopIpAddress: 10.252.0.196
             - nextHopType: VirtualAppliance
## Resource Name: sec-prod-vnet-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/virtualNetworks/sec-prod-vnet-001
### Change Type: Create
 - **Name**: **sec-prod-vnet-001**
 - Type: Microsoft.Network/virtualNetworks
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2024-05-01
### New Resource Details
 - addressSpace: 
     - addressPrefixes: 10.169.1.0/24
 - enableDdosProtection: false
 - subnets: 
     - Item 1: 
         - name: sec-vm-snet-001
         - properties: 
             - addressPrefix: 10.169.1.0/28
             - routeTable: 
                 - id: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/routeTables/sec-vm-snet-rt-001
                 - resourceGroup: sec-prod-rg
 - virtualNetworkPeerings: 
     - Item 1: 
         - name: sec-prod-vnet-001-to-opp-hub-vnet
         - properties: 
             - allowForwardedTraffic: true
             - allowGatewayTransit: false
             - allowVirtualNetworkAccess: true
             - doNotVerifyRemoteGateways: true
             - remoteVirtualNetwork: 
                 - id: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Network/virtualNetworks/opp-hub-vnet
                 - resourceGroup: opp-hub-rg
             - useRemoteGateways: true
## Resource Name: sec-vm-snet-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/virtualNetworks/sec-prod-vnet-001/subnets/sec-vm-snet-001
### Change Type: Create
 - **Name**: **sec-vm-snet-001**
 - Type: Microsoft.Network/virtualNetworks/subnets
 - Resource Group: sec-prod-rg
 - Location: Unknown Location
 - API Version: 2024-05-01
### New Resource Details
 - addressPrefix: 10.169.1.0/28
 - routeTable: 
     - id: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/routeTables/sec-vm-snet-rt-001
     - resourceGroup: sec-prod-rg
## Resource Name: sec-prod-vnet-001-to-opp-hub-vnet
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/virtualNetworks/sec-prod-vnet-001/virtualNetworkPeerings/sec-prod-vnet-001-to-opp-hub-vnet
### Change Type: Create
 - **Name**: **sec-prod-vnet-001-to-opp-hub-vnet**
 - Type: Microsoft.Network/virtualNetworks/virtualNetworkPeerings
 - Resource Group: sec-prod-rg
 - Location: Unknown Location
 - API Version: 2024-01-01
### New Resource Details
 - allowForwardedTraffic: true
 - allowGatewayTransit: false
 - allowVirtualNetworkAccess: true
 - doNotVerifyRemoteGateways: true
 - remoteVirtualNetwork: 
     - id: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Network/virtualNetworks/opp-hub-vnet
     - resourceGroup: opp-hub-rg
 - useRemoteGateways: true
## Resource Name: sec-prod-rg
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg
### Change Type: Create
 - **Name**: **sec-prod-rg**
 - Type: Microsoft.Resources/resourceGroups
 - Location: westus2
 - API Version: 2025-03-01
## Resource Name: sec-ubuntu-prod-vm-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Compute/virtualMachines/sec-ubuntu-prod-vm-001
### Change Type: Create
 - **Name**: **sec-ubuntu-prod-vm-001**
 - Type: Microsoft.Compute/virtualMachines
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2024-07-01
### New Resource Details
 - additionalCapabilities: 
     - hibernationEnabled: false
     - ultraSSDEnabled: false
 - diagnosticsProfile: 
     - bootDiagnostics: 
         - enabled: false
 - hardwareProfile: 
     - vmSize: Standard_B4als_v2
 - networkProfile: 
     - networkInterfaces: [object Object]
 - osProfile: 
     - adminPassword: *******
     - adminUsername: [parameters('adminUsername')]
     - allowExtensionOperations: true
     - computerName: sec-ubuntu-prod-vm-001
     - customData: *******
     - linuxConfiguration: 
         - disablePasswordAuthentication: false
         - provisionVMAgent: true
 - securityProfile: 
     - encryptionAtHost: true
 - storageProfile: 
     - imageReference: 
         - offer: 0001-com-ubuntu-server-jammy
         - publisher: Canonical
         - sku: 22_04-lts-gen2
         - version: latest
     - osDisk: 
         - caching: ReadOnly
         - createOption: FromImage
         - deleteOption: Delete
         - diskSizeGB: 128
         - name: sec-ubuntu-prod-osdisk-001
 - userData: *******
## Resource Name: sec-prod-dest-ipg-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/ipGroups/sec-prod-dest-ipg-001
### Change Type: Create
 - **Name**: **sec-prod-dest-ipg-001**
 - Type: Microsoft.Network/ipGroups
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2024-05-01
### New Resource Details
 - ipAddresses: 
     - Item 1: 10.252.32.0/19
     - Item 2: 10.252.96.0/19
     - Item 3: 10.252.64.0/19
     - Item 4: 10.250.0.0/22
     - Item 5: 10.200.94.0/24
     - Item 6: 10.200.95.0/24
     - Item 7: 10.252.128.0/19
     - Item 8: 10.250.4.0/22
     - Item 9: 10.160.4.0/23
     - Item 10: 10.201.0.0/22
     - Item 11: 10.162.4.0/24
     - Item 12: 10.161.4.0/23
     - Item 13: 10.168.1.0/24
     - Item 14: 10.150.0.0/24
     - Item 15: 10.167.1.0/24
## Resource Name: sec-ubuntu-prod-nic-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/networkInterfaces/sec-ubuntu-prod-nic-001
### Change Type: Create
 - **Name**: **sec-ubuntu-prod-nic-001**
 - Type: Microsoft.Network/networkInterfaces
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2024-05-01
### New Resource Details
 - auxiliaryMode: None
 - auxiliarySku: None
 - disableTcpStateTracking: false
 - enableAcceleratedNetworking: true
 - enableIPForwarding: false
 - ipConfigurations: 
     - Item 1: 
         - name: sec-ubuntu-prod-ipconfig-001
         - properties: 
             - privateIPAddressVersion: IPv4
             - privateIPAllocationMethod: Dynamic
             - subnet: 
                 - id: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/virtualNetworks/sec-prod-vnet-001/subnets/sec-vm-snet-001
                 - resourceGroup: sec-prod-rg
## Resource Name: sec-vm-snet-rt-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/routeTables/sec-vm-snet-rt-001
### Change Type: Create
 - **Name**: **sec-vm-snet-rt-001**
 - Type: Microsoft.Network/routeTables
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2023-04-01
### New Resource Details
 - disableBgpRoutePropagation: false
 - routes: 
     - Item 1: 
         - name: default
         - properties: 
             - addressPrefix: 0.0.0.0/0
             - nextHopIpAddress: 10.252.0.196
             - nextHopType: VirtualAppliance
## Resource Name: sec-prod-vnet-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/virtualNetworks/sec-prod-vnet-001
### Change Type: Create
 - **Name**: **sec-prod-vnet-001**
 - Type: Microsoft.Network/virtualNetworks
 - Resource Group: sec-prod-rg
 - Location: westus2
 - API Version: 2024-05-01
### New Resource Details
 - addressSpace: 
     - addressPrefixes: 10.169.1.0/24
 - enableDdosProtection: false
 - subnets: 
     - Item 1: 
         - name: sec-vm-snet-001
         - properties: 
             - addressPrefix: 10.169.1.0/28
             - routeTable: 
                 - id: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/routeTables/sec-vm-snet-rt-001
                 - resourceGroup: sec-prod-rg
 - virtualNetworkPeerings: 
     - Item 1: 
         - name: sec-prod-vnet-001-to-opp-hub-vnet
         - properties: 
             - allowForwardedTraffic: true
             - allowGatewayTransit: false
             - allowVirtualNetworkAccess: true
             - doNotVerifyRemoteGateways: true
             - remoteVirtualNetwork: 
                 - id: [format('/subscriptions/{0}/resourceGroups/{1}/providers/Microsoft.Network/virtualNetworks/{2}', parameters('hubVNetSubscriptionId'), 'opp-hub-rg', 'opp-hub-vnet')]
                 - resourceGroup: {1}
             - useRemoteGateways: true
## Resource Name: sec-vm-snet-001
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/virtualNetworks/sec-prod-vnet-001/subnets/sec-vm-snet-001
### Change Type: Create
 - **Name**: **sec-vm-snet-001**
 - Type: Microsoft.Network/virtualNetworks/subnets
 - Resource Group: sec-prod-rg
 - Location: Unknown Location
 - API Version: 2024-05-01
### New Resource Details
 - addressPrefix: 10.169.1.0/28
 - routeTable: 
     - id: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/routeTables/sec-vm-snet-rt-001
     - resourceGroup: sec-prod-rg
## Resource Name: sec-prod-vnet-001-to-opp-hub-vnet
> **Resource ID**: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/virtualNetworks/sec-prod-vnet-001/virtualNetworkPeerings/sec-prod-vnet-001-to-opp-hub-vnet
### Change Type: Create
 - **Name**: **sec-prod-vnet-001-to-opp-hub-vnet**
 - Type: Microsoft.Network/virtualNetworks/virtualNetworkPeerings
 - Resource Group: sec-prod-rg
 - Location: Unknown Location
 - API Version: 2024-01-01
### New Resource Details
 - allowForwardedTraffic: true
 - allowGatewayTransit: false
 - allowVirtualNetworkAccess: true
 - doNotVerifyRemoteGateways: true
 - remoteVirtualNetwork: 
     - id: [format('/subscriptions/{0}/resourceGroups/{1}/providers/Microsoft.Network/virtualNetworks/{2}', parameters('hubVNetSubscriptionId'), 'opp-hub-rg', 'opp-hub-vnet')]
     - resourceGroup: {1}
 - useRemoteGateways: true
## Resource Name: opp-hub-vnet-to-sec-prod-vnet-001', parameters('hubVNetSubscriptionId'))]
> **Resource ID**: [format('/subscriptions/{0}/resourceGroups/opp-hub-rg/providers/Microsoft.Network/virtualNetworks/opp-hub-vnet/virtualNetworkPeerings/opp-hub-vnet-to-sec-prod-vnet-001', parameters('hubVNetSubscriptionId'))]
### Change Type: Unsupported
 - **Name**: **opp-hub-vnet-to-sec-prod-vnet-001', parameters('hubVNetSubscriptionId'))]**
 - Type: Microsoft.Network/virtualNetworks/virtualNetworkPeerings
 - Resource Group: opp-hub-rg
 - Location: Unknown Location
 - API Version: 2024-01-01
### Unsupported Change
**Reason**: Changes to the resource declared at 'properties.template.resources[3].properties.template.resources[0]' on line 1 and column 75669 cannot be analyzed because its resource ID or API version cannot be calculated until the deployment is under way. Please see https://aka.ms/WhatIfUnidentifiableResource for more guidance.
### Resource Properties
 - allowForwardedTraffic: true
 - allowGatewayTransit: true
 - allowVirtualNetworkAccess: true
 - doNotVerifyRemoteGateways: true
 - remoteVirtualNetwork: 
     - id: /subscriptions/d3e81098-f3ac-4453-8238-8c2e9bb46494/resourceGroups/sec-prod-rg/providers/Microsoft.Network/virtualNetworks/sec-prod-vnet-001
     - resourceGroup: sec-prod-rg
 - useRemoteGateways: false
## Resource Name: SecurityVMRuleCollectionGroup', parameters('hubVNetSubscriptionId'))]
> **Resource ID**: [format('/subscriptions/{0}/resourceGroups/opp-hub-rg/providers/Microsoft.Network/firewallPolicies/opp-hub-fwn01-policy/ruleCollectionGroups/SecurityVMRuleCollectionGroup', parameters('hubVNetSubscriptionId'))]
### Change Type: Unsupported
 - **Name**: **SecurityVMRuleCollectionGroup', parameters('hubVNetSubscriptionId'))]**
 - Type: Microsoft.Network/firewallPolicies/ruleCollectionGroups
 - Resource Group: opp-hub-rg
 - Location: Unknown Location
 - API Version: 2023-04-01
### Unsupported Change
**Reason**: Changes to the resource declared at 'properties.template.resources[5].properties.template.resources.ruleCollectionGroup' on line 1 and column 89570 cannot be analyzed because its resource ID or API version cannot be calculated until the deployment is under way. Please see https://aka.ms/WhatIfUnidentifiableResource for more guidance.
### Resource Properties
 - priority: 300
 - ruleCollections: 
     - Item 1: 
         - action: 
             - type: Allow
         - name: Allow-Rule-prod
         - priority: 100
         - ruleCollectionType: FirewallPolicyFilterRuleCollection
         - rules: [object Object]
## Diagnostic Code: NestedDeploymentShortCircuited
### Severity: Warning
```text
Resource ID: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Resources/deployments/opp-hub-vnet-to-sec-prod-vnet-001
```
**Message**: A nested deployment got short-circuited and all its resources got skipped from validation. This is due to a nested template having a parameter that was not fully evaluated (e.g. contains a reference() function). Please see https://aka.ms/WhatIfEvalStopped for more guidance.
## Diagnostic Code: NestedDeploymentShortCircuited
### Severity: Warning
```text
Resource ID: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Resources/deployments/SecurityVMRuleCollectionGroup
```
**Message**: A nested deployment got short-circuited and all its resources got skipped from validation. This is due to a nested template having a parameter that was not fully evaluated (e.g. contains a reference() function). Please see https://aka.ms/WhatIfEvalStopped for more guidance.
## Diagnostic Code: NestedDeploymentShortCircuited
### Severity: Warning
```text
Resource ID: /subscriptions/5e9773b6-9d27-4079-86c1-017db5a10eeb/resourceGroups/opp-hub-rg/providers/Microsoft.Resources/deployments/opp-hub-vnet-to-sec-test-vnet-001
```
**Message**: A nested deployment got short-circuited and all its resources got skipped from validation. This is due to a nested template having a parameter that was not fully evaluated (e.g. contains a reference() function). Please see https://aka.ms/WhatIfEvalStopped for more guidance.
## Diagnostic Code: NestedDeploymentShortCircuited
### Severity: Warning
```text
Resource ID: /subscriptions/e1fa0f94-5bfb-42d6-981e-ac50811886c4/resourceGroups/test-firewall/providers/Microsoft.Resources/deployments/SecurityVMRuleCollectionGroup
```
**Message**: A nested deployment got short-circuited and all its resources got skipped from validation. This is due to a nested template having a parameter that was not fully evaluated (e.g. contains a reference() function). Please see https://aka.ms/WhatIfEvalStopped for more guidance.
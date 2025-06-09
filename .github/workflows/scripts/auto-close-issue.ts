module.exports = async ({ github, context, core }) => {
    const projectNumber = 3; // CHANGE to your Project number
    const owner = 'weekendclimber'; // Or repo owner
    const repo = 'BicepWhatIfReport';

    // 1. Get the project ID
    const projectQuery = `
        query($owner: String!, $repo: String!, $number: Int!) {
            repository(owner: $owner, name: $repo) {
                projectV2(number: $number) {
                    id
                    fields(first: 20) {
                        nodes {
                            ... on ProjectV2Field {
                                id
                                name
                            }
                            ... on ProjectV2SingleSelectField {
                                id
                                name
                                options {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    const projectData = await github.graphql(
        projectQuery, {
            owner,
            repo,
            number: projectNumber,
        }
    );
    const project = projectData.repository.projectV2;
    //console.log("project logging...");
    //console.log(JSON.stringify(project.fields.nodes, null, 2));
    const statusField = project.fields.nodes.find(
        f =>
            f.name &&
            f.name.toLowerCase() === 'status' &&
            Array.isArray(f.options)
    );
    
    if (!statusField) {
        throw new Error('Could not find "Status" field with a selectable option in this project.')
    };  
    const doneOption = statusField.options.find(
        o => o.name.toLowerCase() === 'done'
    );
    const closedOption = statusField.options.find(
        o => o.name.toLowerCase() === 'closed'
    )
    
    if(!doneOption) {
        throw new Error('Could not find "Done" option in the "Status" field.');
    }
    if(!closedOption) {
        throw new Error('Could not find "Closed" option in the "Status" field.');
    }     
    // 2. Get items in "Done"
    // (For large projects, you may need to paginate)
    const itemsQuery = `
        query($projectId: ID!) {
            node(id: $projectId) {
                ... on ProjectV2 {
                    items(first: 50) {
                        nodes {
                            id
                            content {
                                ... on Issue {
                                    number
                                    title
                                    updatedAt
                                }
                            }
                            fieldValues(first: 20) {
                                nodes {
                                    ... on ProjectV2ItemFieldSingleSelectValue {
                                        field {
                                            ... on ProjectV2FieldCommon {
                                                id
                                                name
                                            }
                                        }
                                        optionId
                                        updatedAt
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    const itemsData = await github.graphql(itemsQuery, {
        projectId: project.id,
    });
    //console.log("itemsData logging...")
    //console.log(JSON.stringify(itemsData.node.items.nodes, null, 2));
    //console.log('Items found: ', itemsData.node.items.nodes.length);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7*24*60*60*1000);

    for (const item of itemsData.node.items.nodes) {
        const validFieldValues = item.fieldValues.nodes.filter(
            v => v && v.field && typeof v.field.id !== 'undefined'
        );

        if (validFieldValues.length === 0) {
            console.log('No valid field values found for item!');
            continue;
        }

        //console.log('Processing items: ', item.content.title);
        //console.log('Status Field ID: ', statusField.id);
        //console.log('Done Option ID: ', doneOption.id);
        const statusValue = validFieldValues.find(
            v => v.field.id === statusField.id && v.optionId === doneOption.id
        );
        //console.log('Gets here!!');
        //console.log('Status Value: ', statusValue);
        if (!statusValue) {
            console.log('No status value present!');
            continue;
        }
        const doneDate = new Date(statusValue.updatedAt);
        if (doneDate < oneWeekAgo) {
            // 3. Update status to Closed
            const mutation = `
                mutation($itemId: ID!, $fieldId: ID!, $optionId: String!) {
                    updateProjectV2ItemFieldValue(
                        input: {
                            projectId: "${project.id}"
                            itemId: $itemId
                            fieldId: $fieldId
                            value: { singleSelectOptionId: $optionId }
                        }
                    )
                    {
                        projectV2Item {
                            id
                        }
                    }
                }
            `;
            await github.graphql(mutation, {
                itemId: item.id,
                fieldId: statusField.id,
                optionId: closedOption.id,
            });
            console.log(
                `Closed issue #${item.content.number} - "${item.content.title}"`
            );
        }
    }
}
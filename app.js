import { select, rawlist } from '@inquirer/prompts';

import { searchEventsByKeyword, getEventDetails } from './api.js';
import * as db from './db.js';


export const searchAndHandleResults = async (keyword) => {
    try {
        const results = await searchEventsByKeyword(keyword);
        const keywordInDB = await db.find("search_history_keyword", {keyword: keyword});
        // Checks if user has searched this in the past, if not, then insert into DB
        if (keywordInDB.length === 0) {
            await db.insert("search_history_keyword", {keyword: keyword}); // use DB functions
        }

        const displayResults = results.map((result, index) => ({
            name: result.name || `Result ${index + 1}`,
            value: result.id
        }));
        const selectedResultId = await rawlist({
            message: 'Select a search result:',
            choices: displayResults
        });
        
        const selectionInDB = await db.find("search_history_selection", {eventId: selectedResultId});
        // Check if user has selected this specific event in the past
    
        const selectedResultDetails = await getEventDetails(selectedResultId);
        if(selectionInDB.length === 0) {
            await db.insert("search_history_selection", {eventId: selectedResultId, eventName: selectedResultDetails.name});
        }
        console.log('Selected Result Details:', selectedResultDetails);

        
    } catch (error) {
        console.error('Error during search and handling results:', error);
    }
}


// Keyword history prompts

/**
 * 
 * @param {keyword} keywords 
 * passes the keyword onto the main search function and queries the API once again
 *
 */
const _keywordHistoryPrompt = async (keywords) => {
    const displayKeywords = keywords.map((keyword) => {
        return {name: keyword.keyword, value: keyword.keyword}
    });
    displayKeywords.unshift({ name: 'Exit', value: 'exit' }); // allows exit to be the first option
    return await rawlist({
        message: 'Select a previous keyword to navigate to: ',
        choices: displayKeywords
    });
}

export const keywordHistory = async () => {
    // retrieve all keywords
    const keywordCollections = await db.find('search_history_keyword');

    // List prompt all previous keywords
    const keywordSelected = await _keywordHistoryPrompt(keywordCollections);
    if(keywordSelected === 'exit') {
        return;
    }else{
        // redirect user to whatever the user selects
        searchAndHandleResults(keywordSelected);
    }
}

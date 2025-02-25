-- NymnsenInventory Addon - Compatible with original website format
-- Interface: 11506

-- Setup slash command
SLASH_NYMNINV1 = "/nymninv"
SLASH_NYMNINV2 = "/nymnsen"

-- Check if we're using the new Container API
local UseNewAPI = C_Container ~= nil

-- Helper function to safely call functions
local function SafeCall(func, ...)
    if type(func) == "function" then
        return func(...)
    end
    return nil
end

-- Get item count from a bag slot
local function GetItemCount(bag, slot)
    if UseNewAPI then
        -- New API
        local info = C_Container.GetContainerItemInfo(bag, slot)
        if info then
            return info.stackCount or 1
        end
    else
        -- Old API
        local _, count = GetContainerItemInfo(bag, slot)
        if count then
            return count
        end
    end
    return 1
end

-- Define categories and their member functions
local categories = {
    consumables = { id = "consumables", name = "Consumables", items = {} },
    herbs = { id = "herbs", name = "Herbs", items = {} },
    reagents = { id = "reagents", name = "Reagents", items = {} },
    items = { id = "items", name = "Items", items = {} },
    patterns = { id = "patterns", name = "Patterns and Recipes", items = {} },
    cloth = { id = "cloth", name = "Cloth", items = {} },
    other = { id = "other", name = "Other", items = {} }
}

-- Specific item ID to category mappings for edge cases
local specialItemCategories = {
    -- Herbs and herb-like items
    ["10286"] = "herbs", -- Heart of the Wild
    ["8831"] = "herbs",  -- Purple Lotus
    ["8836"] = "herbs",  -- Arthas' Tears
    ["8838"] = "herbs",  -- Sungrass
    ["8839"] = "herbs",  -- Blindweed
    ["8845"] = "herbs",  -- Ghost Mushroom
    ["8846"] = "herbs",  -- Gromsblood
    ["13463"] = "herbs", -- Dreamfoil
    ["13464"] = "herbs", -- Golden Sansam
    ["13465"] = "herbs", -- Mountain Silversage
    ["13466"] = "herbs", -- Sorrowmoss
    ["13467"] = "herbs", -- Icecap
    ["13468"] = "herbs", -- Black Lotus
    
    -- Reagents
    ["7067"] = "reagents", -- Elemental Earth
    ["7068"] = "reagents", -- Elemental Fire
    ["7069"] = "reagents", -- Elemental Air
    ["7070"] = "reagents", -- Elemental Water
    ["7077"] = "reagents", -- Heart of Fire
    ["7078"] = "reagents", -- Essence of Fire
    ["7972"] = "reagents", -- Ichor of Undeath
    ["12808"] = "reagents", -- Essence of Undeath
    
    -- Unique handling for specific items
    ["18781"] = "patterns", -- Bottom Half of Advanced Armorsmithing: Volume II
    ["17056"] = "reagents", -- Light Feather
}

-- Guess category based on item name and type
local function GuessCategory(id, name, itemType, itemSubType)
    -- First check specific item mappings
    if specialItemCategories[id] then
        return specialItemCategories[id]
    end
    
    name = name:lower()
    
    -- Refined keyword matching
    if name:match("potion") or name:match("elixir") or name:match("flask") or
       name:match("food") or name:match("drink") or name:match("scroll") or 
       name:match("bandage") or name:match("soup") or name:match("stout") or
       name:match("ale") or name:match("rum") or name:match("firewater") then
        return "consumables"
    end
    
    if name:match("herb") or name:match("root") or name:match("leaf") or 
       name:match("lotus") or name:match("grass") or name:match("flower") or
       name:match("mushroom") or name:match("cap") or name:match("thistle") or
       name:match("moss") or name:match("bloom") or name:match("weed") then
        return "herbs"
    end
    
    if itemType == "Recipe" or name:match("recipe") or name:match("pattern") or
       name:match("formula") or name:match("schematic") or
       name:match("manual") or name:match("volume") or name:match("guide") then
        return "patterns"
    end
    
    if name:match("cloth") or name:match("bolt of") or
       name:match("silk") or name:match("linen") or name:match("wool") or
       name:match("mageweave") or name:match("runecloth") or name:match("felcloth") or
       name:match("mooncloth") then
        return "cloth"
    end
    
    -- Better reagent detection
    if name:match("dust") or name:match("essence") or name:match("shard") or
       name:match("crystal") or name:match("stone") or name:match("powder") or
       name:match("oil") or name:match("feather") or name:match("scale") or
       name:match("leather") or name:match("hide") or name:match("element") or
       name:match("heart of") or name:match("ichor") or name:match("pearl") or
       name:match("eye of") or name:match("blood of") or name:match("tear of") or
       name:match("e'ko") or name:match("diamond") then
        return "reagents"
    end
    
    -- Item type based categorization
    if itemType == "Consumable" then
        return "consumables"
    end
    
    if itemType == "Trade Goods" then
        if itemSubType == "Herb" then
            return "herbs"
        elseif itemSubType == "Cloth" then
            return "cloth"
        elseif itemSubType == "Leather" or itemSubType == "Metal & Stone" or 
               itemSubType == "Cooking" or itemSubType == "Elemental" or
               itemSubType == "Parts" or itemSubType == "Reagent" or
               itemSubType == "Enchanting" then
            return "reagents"
        end
    end
    
    if itemType == "Armor" or itemType == "Weapon" then
        return "items"
    end
    
    -- Default
    return "other"
end

-- Scan inventory
local function ScanInventory()
    print("Scanning inventory...")
    
    -- Reset categories
    for _, cat in pairs(categories) do
        cat.items = {}
    end
    
    -- Function to add an item to our results
    local function AddItem(id, name, count, quality, itemType, itemSubType)
        if id and name and count > 0 then
            -- Determine quality name
            local qualityName = "common"
            if quality == 2 then qualityName = "uncommon"
            elseif quality == 3 then qualityName = "rare"
            elseif quality == 4 then qualityName = "epic"
            elseif quality == 5 then qualityName = "legendary"
            end
            
            -- Guess category
            local category = GuessCategory(id, name, itemType, itemSubType)
            
            -- Set a default price based on quality
            local price = 10 -- Default price
            
            -- Check if item already exists in category
            local exists = false
            for i, item in ipairs(categories[category].items) do
                if item.id == id then
                    item.stock = item.stock + count
                    exists = true
                    break
                end
            end
            
            -- Add new item if doesn't exist
            if not exists then
                local isUnique = false
                if category == "items" and quality >= 3 then
                    isUnique = true
                end
                
                table.insert(categories[category].items, {
                    id = id,
                    name = name,
                    price = price,
                    stock = count,
                    quality = qualityName,
                    unique = isUnique
                })
            end
        end
    end
    
    -- Function to scan a bag
    local function ScanBag(bagID)
        local numSlots = 0
        
        -- Get number of slots
        if UseNewAPI then
            numSlots = C_Container.GetContainerNumSlots(bagID)
        else
            numSlots = GetContainerNumSlots(bagID)
        end
        
        if numSlots <= 0 then return end
        
        for slot = 1, numSlots do
            local itemLink = nil
            
            -- Get item link
            if UseNewAPI then
                itemLink = C_Container.GetContainerItemLink(bagID, slot)
            else
                itemLink = GetContainerItemLink(bagID, slot)
            end
            
            if itemLink then
                local itemID = itemLink:match("item:(%d+)")
                local name, _, quality, _, _, itemType, itemSubType = GetItemInfo(itemLink)
                local itemCount = GetItemCount(bagID, slot)
                
                AddItem(itemID, name, itemCount, quality, itemType, itemSubType)
            end
        end
    end
    
    -- Scan regular bags (0-4)
    for bag = 0, 4 do
        ScanBag(bag)
    end
    
    -- Try to scan bank (-1)
    ScanBag(-1)
    
    -- Try to scan bank bags (5-11)
    for bag = 5, 11 do
        ScanBag(bag)
    end
    
    -- Count total items
    local totalItems = 0
    for _, cat in pairs(categories) do
        totalItems = totalItems + #cat.items
    end
    
    print("Found " .. totalItems .. " items in inventory.")
    DisplayResults(categories)
end

-- Display results in a window
function DisplayResults(categories)
    -- Create a basic frame
    local frame = CreateFrame("Frame", "NymnsenResultFrame", UIParent, "BasicFrameTemplateWithInset")
    frame:SetSize(600, 500)
    frame:SetPoint("CENTER")
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetScript("OnDragStart", frame.StartMoving)
    frame:SetScript("OnDragStop", frame.StopMovingOrSizing)
    
    -- Title
    local title = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlight")
    title:SetPoint("TOP", 0, -10)
    title:SetText("Inventory Scan Results")
    
    -- Create a scrollframe
    local scrollFrame = CreateFrame("ScrollFrame", nil, frame, "UIPanelScrollFrameTemplate")
    scrollFrame:SetPoint("TOPLEFT", 15, -30)
    scrollFrame:SetPoint("BOTTOMRIGHT", -35, 40)
    
    -- Create an edit box for the scrollframe
    local editBox = CreateFrame("EditBox", nil, scrollFrame)
    editBox:SetMultiLine(true)
    editBox:SetFontObject(ChatFontNormal)
    editBox:SetWidth(scrollFrame:GetWidth())
    editBox:SetAutoFocus(false)
    editBox:SetScript("OnEscapePressed", function() frame:Hide() end)
    
    -- Set the scrollchild
    scrollFrame:SetScrollChild(editBox)
    
    -- Generate JS for website (original format)
    local text = "// Generated by NymnsenInventory addon\n"
    text = text .. "const inventory = {\n"
    text = text .. "    categories: [\n"
    
    -- Order of categories
    local categoryOrder = {"consumables", "herbs", "reagents", "items", "patterns", "cloth", "other"}
    
    -- Add each non-empty category
    for _, catKey in ipairs(categoryOrder) do
        local category = categories[catKey]
        
        -- Only include non-empty categories
        if #category.items > 0 then
            -- Sort items by name
            table.sort(category.items, function(a, b) return a.name < b.name end)
            
            text = text .. "        {\n"
            text = text .. '            id: "' .. category.id .. '",\n'
            text = text .. '            name: "' .. category.name .. '",\n'
            text = text .. "            items: [\n"
            
            -- Add each item
            for _, item in ipairs(category.items) do
                text = text .. "                {\n"
                text = text .. '                    id: "' .. item.id .. '",\n'
                text = text .. '                    name: "' .. item.name .. '",\n'
                text = text .. '                    price: ' .. item.price .. ',\n'
                text = text .. '                    stock: ' .. item.stock .. ',\n'
                text = text .. '                    quality: "' .. item.quality .. '"'
                
                if item.unique then
                    text = text .. ',\n                    unique: true'
                end
                
                text = text .. "\n                },\n"
            end
            
            text = text .. "            ]\n"
            text = text .. "        },\n"
        end
    end
    
    text = text .. "    ]\n"
    text = text .. "};"
    
    -- Set the text
    editBox:SetText(text)
    
    -- Highlight text for easy copying
    editBox:HighlightText()
    
    -- Create a button to close the frame
    local closeButton = CreateFrame("Button", nil, frame, "UIPanelButtonTemplate")
    closeButton:SetSize(80, 25)
    closeButton:SetPoint("BOTTOM", 0, 10)
    closeButton:SetText("Close")
    closeButton:SetScript("OnClick", function() frame:Hide() end)
    
    -- Show the frame
    frame:Show()
    
    -- Print a note about copying
    print("Copy the text from the window and paste it into your inventory.js file")
end

-- Register slash command
SlashCmdList["NYMNINV"] = function(msg)
    ScanInventory()
end

print("|cFFFFD700Nymnsen's Inventory Scanner|r loaded. Type /nymninv to scan.")
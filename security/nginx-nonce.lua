-- Lua script for nginx to inject CSP nonces into HTML
-- This script generates a secure nonce and injects it into script tags

local function generate_nonce()
    -- Generate a cryptographically secure random nonce
    local charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    local nonce = ""
    
    -- Generate 16 random bytes (128 bits) for security
    for i = 1, 16 do
        local rand = math.random(1, #charset)
        nonce = nonce .. string.sub(charset, rand, rand)
    end
    
    return nonce
end

local function inject_nonce_into_html(html, nonce)
    -- Inject nonce into JSON-LD script tags
    html = string.gsub(html, '(<script type="application/ld%+json"[^>]*>)', '%1<!-- nonce="' .. nonce .. '" -->')
    
    -- Inject nonce into inline script tags (without src attribute)
    html = string.gsub(html, '(<script(?![^>]*src)[^>]*>)', function(script_tag)
        if string.find(script_tag, 'nonce=') then
            return script_tag -- Already has nonce
        end
        return string.gsub(script_tag, '>', ' nonce="' .. nonce .. '">')
    end)
    
    -- Inject nonce into script tags with src
    html = string.gsub(html, '(<script[^>]*src[^>]*>)', function(script_tag)
        if string.find(script_tag, 'nonce=') then
            return script_tag -- Already has nonce
        end
        return string.gsub(script_tag, '>', ' nonce="' .. nonce .. '">')
    end)
    
    return html
end

-- Main function to be called by nginx
function inject_nonce()
    -- Generate nonce
    local nonce = generate_nonce()
    
    -- Set nonce as nginx variable for use in CSP header
    ngx.var.csp_nonce = nonce
    
    -- Get the response body (HTML)
    local body = ngx.arg[1]
    
    if body and string.find(body, "<html") then
        -- Inject nonce into HTML
        local modified_html = inject_nonce_into_html(body, nonce)
        ngx.arg[1] = modified_html
    end
end

-- Initialize random seed
math.randomseed(ngx.time() + ngx.worker.pid())

return {
    inject_nonce = inject_nonce,
    generate_nonce = generate_nonce
}

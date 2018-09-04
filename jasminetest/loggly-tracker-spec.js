describe("loggly.tracker", function() {
    var baseLogglyKey = '3cb08350-365e-4ea3-a6ff-e7917065094b';

    function resetCookie() {
        document.cookie = 'logglytrackingsession=; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
    
    beforeEach(function() {
        resetCookie();
        _LTracker.setSession();
        jasmine.Clock.useMock();
        
        _LTracker.push({'logglyKey': baseLogglyKey})
        jasmine.Clock.tick(20);
    });
    
    afterEach(function() {
        _LTracker.session_id = '';
        resetCookie();
    });

    it("exists", function() {
        expect(_LTracker).not.toBe(null);
    });
    
    it("sets and reads cookies", function() {
        var value = 'randomcookievaluelogglytracker';
        _LTracker.setCookie(value);
        var i = document.cookie.indexOf(value);
        
        expect(document.cookie.indexOf(value)).toBeGreaterThan(-1);
        expect(document.cookie.indexOf('logglytrackingsession')).toBeGreaterThan(-1);
        expect(_LTracker.readCookie()).toBe(value);
    });
    
    it("sets uuid automatically to object and cookie", function() {        
        var uuid = _LTracker.session_id;
        
        expect(uuid).not.toBe(null);
        expect(document.cookie.indexOf(uuid)).toBeGreaterThan(-1);
        expect(_LTracker.readCookie()).toBe(uuid);
    });
    
    it("sets uuid manually to object and cookie", function() {        
        var initial = '1324123412';
        
        spyOn(_LTracker, 'setCookie').andCallThrough();
        _LTracker.setSession(initial);

        expect(_LTracker.setCookie).toHaveBeenCalledWith(initial);
        expect(_LTracker.session_id).toBe(initial);
        expect(document.cookie.indexOf(initial)).toBeGreaterThan(-1);
        expect(_LTracker.readCookie()).toBe(initial);
        
        var replacement = '9932483828';
        _LTracker.setSession(replacement);
        expect(_LTracker.readCookie()).toBe(replacement);
        
        _LTracker.session_id = '';  // reset
    });
    
    it("does not auto replace session id", function() {
        var uuid = _LTracker.session_id;
        _LTracker.setSession(); // second call that should be no op
        
        expect(_LTracker.readCookie()).toBe(uuid);
        
        _LTracker.session_id = '';
    });
    
    it("sets loggly key correctly by pushing", function() {
        var originalKey = _LTracker.key,
            madeupKey = 'madeupkey';
            
        spyOn(_LTracker, 'track');
        _LTracker.push({'logglyKey': madeupKey});
        
        jasmine.Clock.tick(20);
        
        var key = _LTracker.key;
        expect(_LTracker.key).toBe(madeupKey);
        expect(_LTracker.inputUrl).toContain(madeupKey + '/tag');
        expect(_LTracker.track).not.toHaveBeenCalled();
        
        _LTracker.push({'logglyKey': originalKey});    // put it back to original state
        jasmine.Clock.tick(20);
        
        expect(_LTracker.key).toBe(originalKey);
    });
    
    it("sets custom collector domain", function() {
        var customDomain = "logglyidontexist.com";
        _LTracker.push({'logglyCollectorDomain': customDomain});
        _LTracker.push({'logglyKey': _LTracker.key});   // kick it so it sets the collector domain
        
        jasmine.Clock.tick(20);
        
        expect(_LTracker.logglyCollectorDomain).toBe(customDomain);
        expect(_LTracker.inputUrl).toContain('http://' + customDomain + '/inputs/');
        
        delete _LTracker.logglyCollectorDomain;
        _LTracker.push({'logglyKey': _LTracker.key});
        jasmine.Clock.tick(20);
        
    });
    
    it("calls track when pushing normal tracking object", function() {
        spyOn(_LTracker, 'track');
        
        var data = {'hoover': 'isabeaver'};
        
        _LTracker.push(data);
        jasmine.Clock.tick(20);
        
        expect(_LTracker.track).toHaveBeenCalledWith(data);
    });
    
    it("calls track with formatted message if single string is passed", function() {
        spyOn(_LTracker, 'track');
        
        var data = 'hooverisabeaver';
        
        _LTracker.push(data);
        jasmine.Clock.tick(20);
        
        expect(_LTracker.track).toHaveBeenCalledWith({'text': data});
    });
    
    it("does not call track when pushed junk", function() {
        spyOn(_LTracker, 'track');
        
        _LTracker.push('');
        jasmine.Clock.tick(20);
        
        expect(_LTracker.track).not.toHaveBeenCalled();
        
        _LTracker.push();
        jasmine.Clock.tick(20);
        
        expect(_LTracker.track).not.toHaveBeenCalled();
    });
    
    it("can instantiate additional loggly tracker", function() {
        expect(LogglyTracker).not.toBe(null);
        
        var localTracker = new LogglyTracker(),
            madeupKey = 'madeupkey',
            lKey = _LTracker.key;
            
        localTracker.push({'logglyKey':madeupKey});
        jasmine.Clock.tick(20);
        
        expect(localTracker.key).toBe(madeupKey);
        expect(_LTracker.key).not.toBe(madeupKey);
        expect(_LTracker.key).toBe(lKey);
        
        spyOn(localTracker, 'track');
        spyOn(_LTracker, 'track');
        
        var data = {'randomdata':'random'};
        
        localTracker.push(data);
        jasmine.Clock.tick(20);
        
        expect(localTracker.track).toHaveBeenCalledWith(data);
        expect(_LTracker.track).not.toHaveBeenCalled()
    });

    it("sets the tag and baseTag on initial push", function() {
        var localTracker = new LogglyTracker(),
            madeupKey = 'madeupkey',
            baseTag = 'tag1',
            secondTag = 'tag2',
            thirdTag = 'tag3';

        localTracker.push({'logglyKey':madeupKey, 'tag':baseTag});

        expect(localTracker.tag).toBe(baseTag);
        expect(localTracker.baseTag).toBe(baseTag);
        expect(localTracker.inputUrl).toContain('/tag/' + baseTag);

        localTracker.push({'tag':secondTag});

        expect(localTracker.inputUrl).toContain('/tag/' + baseTag);
        expect(localTracker.inputUrl).not.toContain('/tag/' + baseTag + ',' + secondTag);

        localTracker.push({'tag':thirdTag});

        expect(localTracker.inputUrl).toContain('/tag/' + baseTag);
        expect(localTracker.inputUrl).not.toContain('/tag/' + baseTag + ',' + thirdTag);
        expect(localTracker.inputUrl).not.toContain('/tag/' + baseTag + ',' + secondTag + ',' + thirdTag);

        localTracker.push({'foo':'bar'});

        expect(localTracker.inputUrl).toContain('/tag/' + baseTag);
    });

});

var TIP = getObject(TIP || {});

(function(){

    var $container = $('#activeWorkflows');

    TIP.workflowDisplay = function(opts) {
        var searchId = opts.searchId || false,
            workflowTableId = opts.containerId || false,
            projectId = opts.projectId || false,
            userEditable = opts.userEditable || false,
            userAdmin = opts.admin || false,
            subjectTerm = opts.subjectTerm || 'Subject',
            sessionTerm = opts.sessionTerm || 'MR Session',
            projectTerm = opts.projectTerm || 'Project';

        var workflowTable = function(results,userEditable){
            // results: [ { patientName: '', sessionId: '', sessionLabel: '', sessionDate: '', workflowEntries: [ 'entry' ], subjectId: '', projectId: '' ]

            var wkTable = new XNAT.table({
                id: workflowTableId,
                addClass: 'xnat-table',
                style: { width: '100%' }
            });

            wkTable.tr()
                .th({ addClass: 'workflowListingDetail' }, subjectTerm + ' Name')
                .th({ addClass: 'workflowListingDetail' }, 'Active ' + sessionTerm)
                .th(sessionTerm + ' Date')
                .th({ addClass: 'projectCol' }, projectTerm)
                .th('Processing Log')
                .th('Output to PACS')
                .th({ addClass: 'tipActions' }, 'TIP Status');

            if (results.length) {
                results.forEach(function(result){
                    wkTable.tr()
                        .td( result.patientName )
                        .td([ showSessionLink(result) ])
                        .td( result.sessionDate )
                        .td({ addClass: 'projectCol' }, result.projectId)
                        .td([ showProcessLog(result.workflowEntries) ])
                        .td({ addClass: 'tipActions' },[ showTipActions(userEditable, result) ])

                })
            }
            else {
                wkTable.tr()
                    .td({ colspan: 7 }, 'No active workflows found');
            }

            function showSessionLink(id,label){
                return spawn('a',{
                    href: XNAT.url.rootUrl('/data/experiments/'+id+'?format=html'),
                    style: { 'font-weight': 'bold' },
                    html: label
                })
            }
            function showProcessLog(entries){
                if (entries.length) {
                    var log = [];
                    entries.forEach(function(entry){
                        log.push(spawn('p',entry))
                    });
                    return spawn('!',log)
                }
            }
            function showTipActions(result){
                return spawn('button', {
                    id: 'set-'+result.sessionId,
                    onclick: TIP.setStatus(this, 'setActivePatientForm'),
                    data: {
                        currentStatus: 'active',
                        projectId: result.projectId,
                        subjectId: result.subjectId,
                        sessionId: result.sessionId
                    },
                    html: 'Mark Complete'
                })
            }

            return wkTable.table;

        };

        var displayProjectWorkflow = function(results){
            var formattedResults = [];

            results.forEach(function(result){
                if (result.project === projectId) {
                    // get all benice and freesurfer results from a single stored search.


                }
            });
            for (var i= 0, j=results.length; i<j; i++ ){
                if (results[i].project == projectId) {

                    foundSubjectsInProject = true;

                    XNAT.xhr.getJSON(reqUrl)
                        .success(function(data) {
                            var sessionResources, sessionAssessors, sessionScans, sessionCustomFields,
                                sessionChildren = data.items[0].children, sessionMeta = data.items[0].data_fields;
                            sessionChildren.forEach(function(child){
                                if (child.field == "resources/resource") {
                                    sessionResources = child.items;
                                }
                                if (child.field == "scans/scan") {
                                    sessionScans = child.items;
                                }
                                if (child.field == "fields/field") {
                                    sessionCustomFields = child.items;
                                }
                                if (child.field == "assessors/assessor") {
                                    sessionAssessors = child.items;
                                }
                            });

                            var patientName = sessionMeta.dcmPatientName.replace(/\^/g, ' ');
                            patientName = patientName.replace(' ', ', ');

                            var row = '<tr>';
                            row += '<td class="workflowListingDetail">' + patientName + '</td>';
                            row += '<td class="workflowListingDetail"><a href="/data/archive/experiments/' + sessionMeta.id + '?format=html">' + sessionMeta.label + '</a></td>';
                            row += '<td>' + sessionMeta.date + '</td>';

                            if (sessionResources && !sessionAssessors) {
                                for (k = 0, l = sessionResources.length; k < l; k++) {
                                    if (sessionResources[0].data_fields.content == 'BENICE_PROCESSING') {
                                        var resourceDate = new Date(sessionResources[0].meta.start_date).toISOString().substr(0, 10);
                                        row += '<td class="workflowEntry">';
                                        row += '<p>RSN Networks Generated: ' + resourceDate + '</p>';
                                        row += '<p>RSN QC Status: </p></td>';
                                        row += '<td class="workflowEntry"><p>?</p></td>';
                                        if (userEditable) {
                                            row += '<td><button id="set-' + sessionMeta.id + '" onclick="TIP.setStatus(this,\'setActivePatientForm\')" data-currentStatus="active" data-projectId="' + projectId + '" data-subjectId="' + sessionMeta.subject_ID + '" data-sessionId="' + sessionMeta.id + '">Mark Complete</button></td>';
                                        }
                                        row += '</tr>';
                                        jq(workflowTable).append(row);
                                    }
                                }

                            } else if (sessionAssessors) {
                                for (k = 0, l = sessionAssessors.length; k < 1; k++) {
                                    var assessorMeta = sessionAssessors[k].meta;
                                    var assessorChildren = sessionAssessors[k].children;
                                    var assessorData = sessionAssessors[k].data_fields;
                                    for (m = 0, n = assessorChildren.length; m < n; m++) {
                                        if (assessorChildren[m].field === "validation") {
                                            var validationStatus = assessorChildren[m].items[0].data_fields.status;
                                            break;
                                        }
                                    }
                                    if (assessorMeta['xsi:type'] === 'tip:beniceQc') {
                                        row += '<td class="workflowEntry">';
                                        row += '<p>RSN Networks Generated: <a href="/data/archive/experiments/' + sessionMeta.id + '/assessors/' + sessionAssessors[k].data_fields.id + '?format=html">' + sessionAssessors[k].data_fields.date + '</a></p>';
                                        row += '<p>RSN QC Status: ' + validationStatus + '</p></td>';
                                        row += '<td class="workflowEntry"><p>?</p></td>';
                                        if (userEditable) {
                                            row += '<td><button id="set-' + sessionMeta.id + '" onclick="TIP.setStatus(this,\'setActivePatientForm\')" data-projectId="' + projectId + '" data-subjectId="' + sessionMeta.subject_ID + '" data-sessionId="' + sessionMeta.id + '">Mark Complete</button></td>';
                                        }
                                        row += '</tr>';
                                        jq(workflowTable).append(row);
                                    } else if (assessorMeta.fs_version || assessorMeta['xsi:type'] === 'fs:fsData') {
                                        // find freesurfer qc assessor, if it exists
                                        for (var index = 0; index < assessorChildren.length; index++) {
                                            if (assessorChildren[index].field && assessorChildren[index].field === 'validation') {
                                                var assessorQc = assessorChildren[index].items[0].data_fields;
                                            }
                                        }
                                        row += '<td class="workflowEntry">';
                                        row += '<p>FreeSurfer: <a href="/data/archive/experiments/' + sessionMeta.id + '/assessors/' + assessorData.id + '?format=html">' + assessorData.date + '</a></p>';
                                        if (assessorQc) {
                                            row += '<p>QC: ' + assessorQc.status + '(' + assessorQc.date + ')</p>';
                                        } else {
                                            row += '<p>Needs QC</p>';
                                        }
                                        row += '</td>';
                                        row += '<td class="workflowEntry"><p>?</p></td>';
                                        if (userEditable) {
                                            row += '<td><button id="set-' + sessionMeta.id + '" onclick="TIP.setStatus(this,\'setActivePatientForm\')" data-projectId="' + projectId + '" data-subjectId="' + sessionMeta.subject_ID + '" data-sessionId="' + sessionMeta.id + '">Mark Complete</button></td>';
                                        }
                                        row += '</tr>';
                                        jq(workflowTable).append(row);
                                    } else {
                                        row += '<td></td><td></td>';
                                        if (userEditable) {
                                            row += '<td><button id="set-' + sessionMeta.id + '" onclick="TIP.setStatus(this,\'setActivePatientForm\')" data-projectId="' + projectId + '" data-subjectId="' + sessionMeta.subject_ID + '" data-sessionId="' + sessionMeta.id + '">Mark Complete</button></td>';
                                        }
                                        row += '</tr>';
                                        jq(workflowTable).append(row);
                                    }
                                }
                            } else {
                                row += '<td></td><td></td>';
                                if (userEditable) {
                                    row += '<td><button id="set-' + sessionMeta.id + '" onclick="TIP.setStatus(this,\'setActivePatientForm\')" data-projectId="' + projectId + '" data-subjectId="' + sessionMeta.subject_ID + '" data-sessionId="' + sessionMeta.id + '">Mark Complete</button></td>';
                                }
                                row += '</tr>';
                                jq(workflowTable).append(row);
                            }
                        });

                }
            }

        };

        var displayAllWorkflow = function(){
            for (var i= 0, j=results.length; i<j; i++ ){

                var reqUrl = XNAT.url.csrfUrl("/REST/experiments/"+results[i].session_id+"?format=json");
                XNAT.xhr.getJSON({
                    url: reqUrl,
                    success: function (data) {
                        var sessionResources, sessionAssessors, sessionScans, sessionCustomFields,
                            sessionChildren = data.items[0].children, sessionMeta = data.items[0].data_fields;
                        for (var k = 0, l = sessionChildren.length; k < l; k++) {
                            if (sessionChildren[k].field == "resources/resource") {
                                sessionResources = sessionChildren[k].items;
                            }
                            if (sessionChildren[k].field == "scans/scan") {
                                sessionScans = sessionChildren[k].items;
                            }
                            if (sessionChildren[k].field == "fields/field") {
                                sessionCustomFields = sessionChildren[k].items;
                            }
                            if (sessionChildren[k].field == "assessors/assessor") {
                                sessionAssessors = sessionChildren[k].items;
                            }
                        }
                        var patientName = sessionMeta.dcmPatientName.replace(/\^/g, ' ');
                        patientName = patientName.replace(' ', ', ');

                        var row = '<tr>';
                        row += '<td class="workflowListingDetail">' + patientName + '</td>';
                        row += '<td class="workflowListingDetail"><a href="/data/archive/experiments/' + sessionMeta.id + '?format=html">' + sessionMeta.label + '</a></td>';
                        row += '<td>' + sessionMeta.date + '</td>';
                        row += '<td>' + sessionMeta.project + '</td>';

                        if (sessionResources && !sessionAssessors) {
                            for (k = 0, l = sessionResources.length; k < l; k++) {
                                if (sessionResources[0].data_fields.content == 'BENICE_PROCESSING') {
                                    var resourceDate = new Date(sessionResources[0].meta.start_date).toISOString().substr(0, 10);
                                    row += '<td class="workflowEntry">';
                                    row += '<p>RSN Networks Generated: ' + resourceDate + '</p>';
                                    row += '<p>RSN QC Status: </p></td>';
                                    row += '<td class="workflowEntry"><p>?</p></td>';
                                    row += '</tr>';
                                    jq(workflowTable).append(row);
                                }
                            }

                        } else if (sessionAssessors) {
                            for (k = 0, l = sessionAssessors.length; k < 1; k++) {
                                var assessorMeta = sessionAssessors[k].meta;
                                var assessorChildren = sessionAssessors[k].children;
                                var assessorData = sessionAssessors[k].data_fields;
                                for (m = 0, n = assessorChildren.length; m < n; m++) {
                                    if (assessorChildren[m].field === "validation") {
                                        var validationStatus = assessorChildren[m].items[0].data_fields.status;
                                        break;
                                    }
                                }
                                if (assessorMeta['xsi:type'] === 'tip:beniceQc') {
                                    row += '<td class="workflowEntry">';
                                    row += '<p>RSN Networks Generated: <a href="/data/archive/experiments/' + sessionMeta.id + '/assessors/' + sessionAssessors[k].data_fields.id + '?format=html">' + sessionAssessors[k].data_fields.date + '</a></p>';
                                    row += '<p>RSN QC Status: ' + validationStatus + '</p></td>';
                                    row += '<td class="workflowEntry"><p>?</p></td>';
                                    row += '</tr>';
                                    jq(workflowTable).append(row);
                                } else if (assessorMeta.fs_version || assessorMeta['xsi:type'] === 'fs:fsData') {
                                    // find freesurfer qc assessor, if it exists
                                    for (var index = 0; index < assessorChildren.length; index++) {
                                        if (assessorChildren[index].field && assessorChildren[index].field === 'validation') {
                                            var assessorQc = assessorChildren[index].items[0].data_fields;
                                        }
                                    }
                                    row += '<td class="workflowEntry">';
                                    row += '<p>FreeSurfer: <a href="/data/archive/experiments/' + sessionMeta.id + '/assessors/' + assessorData.id + '?format=html">' + assessorData.date + '</a></p>';
                                    if (assessorQc) {
                                        row += '<p>QC: ' + assessorQc.status + '(' + assessorQc.date + ')</p>';
                                    } else {
                                        row += '<p>Needs QC</p>';
                                    }
                                    row += '</td>';
                                    row += '<td class="workflowEntry"><p>?</p></td>';
                                    row += '</tr>';
                                    jq(workflowTable).append(row);
                                } else {
                                    row += '<td></td><td></td>';
                                    row += '</tr>';
                                    jq(workflowTable).append(row);
                                }
                            }
                        } else {
                            row += '<td></td><td></td>';
                            row += '</tr>';
                            jq(workflowTable).append(row);
                        }

                    }
                });
            }
        };

        var queryWorkflow = function(){
            XNAT.xhr.getJSON({
                url: XNAT.url.rootUrl('/data/search/saved/' + searchId + '/results?format=json'),
                success: function (data) {

                    var rawResults = data.ResultSet.Result;
                    if ((rawResults.length > 0) && (projectId)) {
                        displayProjectWorkflow(rawResults);
                    } else if (rawResults.length > 0) {
                        displayAllWorkflow(rawResults);
                    } else {
                        $container.append( spawn('p','No active patients found') );
                    }
                },
                fail: function (e) {
                    var msg = 'An error occurred while looking up active workflows. ' + (userAdmin) ? '' : 'Please contact a site administrator.';
                    $container.append(spawn('p',msg));
                    console.log("Error found in search ID: "+ searchId);
                    console.log(e);
                }
            });
        };

        if (searchId) {
            $container.append( spawn('h2','Patients with Active Workflows') );

            queryWorkflow();
        }
        else {
            var msg = '<strong>TIP Setup:</strong> Workflow Display has not been enabled on this site.';
            if (userAdmin) {
                msg += 'To enable this feature, go to <code>Administer > Plugin Settings > TIP Site Setup</code> and enter the stored search ID related to your workflows.'
            }
            $container.append(spawn('div.note', msg ));
        }
    }
})();




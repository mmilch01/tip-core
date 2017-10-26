if (!TIP) var TIP = {};

(function(){

    TIP.workflowDisplay = function(searchId,workflowTableId,projectId,userEditable) {
        var results;
        var workflowTable = $('#'+workflowTableId+' table tbody');

        var displayProjectWorkflow = function(){
            var foundSubjectsInProject = false;
            for (var i= 0, j=results.length; i<j; i++ ){
                if (results[i].project == projectId) {

                    foundSubjectsInProject = true;

                    var reqUrl = "/data/archive/projects/"+projectId+"/subjects/"+results[i].xnat_subjectdata_subjectid+"/experiments/"+results[i].session_id+"?format=json&xnat-csrf="+csrfToken;
                    jq.getJSON(reqUrl,function(data){
                        var sessionResources, sessionAssessors, sessionScans, sessionCustomFields, sessionChildren = data.items[0].children, sessionMeta = data.items[0].data_fields;
                        for (var k=0, l=sessionChildren.length; k<l; k++) {
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

                        var patientName = sessionMeta.dcmPatientName.replace(/\^/g,' ');
                        patientName = patientName.replace(' ',', ');

                        var row = '<tr>';
                        row += '<td class="workflowListingDetail"><h3 class="sessionLabel" style="font-weight: normal">' + patientName + '</h3></td>';
                        row += '<td class="workflowListingDetail"><h3 class="sessionLabel"><a href="/data/archive/experiments/' + sessionMeta.id + '?format=html">' + sessionMeta.label + '</a></h3></td>';
                        row += '<td>' + sessionMeta.date + '</td>';

                        if (sessionResources && !sessionAssessors)  {
                            for (k= 0, l=sessionResources.length; k<l; k++) {
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
                            for (k= 0, l=sessionAssessors.length; k<1; k++) {
                                var assessorMeta = sessionAssessors[k].meta;
                                var assessorChildren = sessionAssessors[k].children;
                                var assessorData = sessionAssessors[k].data_fields;
                                for (m=0, n=assessorChildren.length; m<n; m++) {
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
                                } else

                                if (assessorMeta.fs_version || assessorMeta['xsi:type'] === 'fs:fsData') {
                                    // find freesurfer qc assessor, if it exists
                                    for (var index = 0; index < assessorChildren.length; index++) {
                                        if (assessorChildren[index].field && assessorChildren[index].field === 'validation') {
                                            var assessorQc = assessorChildren[index].items[0].data_fields;
                                        }
                                    }
                                    row += '<td class="workflowEntry">';
                                    row += '<p>FreeSurfer: <a href="/data/archive/experiments/' + sessionMeta.id + '/assessors/' + assessorData.id + '?format=html">' + assessorData.date + '</a></p>';
                                    if (assessorQc) {
                                        row += '<p>QC: '+ assessorQc.status + '(' + assessorQc.date + ')</p>';
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
                                } else

                                {
                                    row += '<td colspan="2"></td>';
                                    if (userEditable) {
                                        row += '<td><button id="set-' + sessionMeta.id + '" onclick="TIP.setStatus(this,\'setActivePatientForm\')" data-projectId="' + projectId + '" data-subjectId="' + sessionMeta.subject_ID + '" data-sessionId="' + sessionMeta.id + '">Mark Complete</button></td>';
                                    }
                                    row += '</tr>';
                                    jq(workflowTable).append(row);
                                }
                            }
                        } else {
                            row += '<td colspan="2"></td>';
                            if (userEditable) {
                                row += '<td><button id="set-' + sessionMeta.id + '" onclick="TIP.setStatus(this,\'setActivePatientForm\')" data-projectId="' + projectId + '" data-subjectId="' + sessionMeta.subject_ID + '" data-sessionId="' + sessionMeta.id + '">Mark Complete</button></td>';
                            }
                            row += '</tr>';
                            jq(workflowTable).append(row);
                        }

                    });

                }
            }

            if (!foundSubjectsInProject) {
                $(workflowTable).append("<tr><td colspan='6'><p>No active patients found in this project</p></td></tr>");
            }
        };

        var displayAllWorkflow = function(){
            for (var i= 0, j=results.length; i<j; i++ ){

                var reqUrl = "/REST/experiments/"+results[i].session_id+"?format=json&xnat-csrf="+csrfToken;
                jq.getJSON(reqUrl,function(data){
                    var sessionResources, sessionAssessors, sessionScans, sessionCustomFields, sessionChildren = data.items[0].children, sessionMeta = data.items[0].data_fields;
                    for (var k=0, l=sessionChildren.length; k<l; k++) {
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
                    var patientName = sessionMeta.dcmPatientName.replace(/\^/g,' ');
                    patientName = patientName.replace(' ',', ');

                    var row = '<tr>';
                    row += '<td class="workflowListingDetail"><h3 class="sessionLabel" style="font-weight: normal;">' + patientName + '</h3></td>';
                    row += '<td class="workflowListingDetail"><h3 class="sessionLabel"><a href="/data/archive/experiments/' + sessionMeta.id + '?format=html">' + sessionMeta.label + '</a></h3></td>';
                    row += '<td>'+sessionMeta.date+'</td>';
                    row += '<td>'+sessionMeta.project+'</td>';

                    if (sessionResources && !sessionAssessors)  {
                        for (k= 0, l=sessionResources.length; k<l; k++) {
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
                        for (k= 0, l=sessionAssessors.length; k<1; k++) {
                            var assessorMeta = sessionAssessors[k].meta;
                            var assessorChildren = sessionAssessors[k].children;
                            var assessorData = sessionAssessors[k].data_fields;
                            for (m=0, n=assessorChildren.length; m<n; m++) {
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
                            } else

                            if (assessorMeta.fs_version || assessorMeta['xsi:type'] === 'fs:fsData') {
                                // find freesurfer qc assessor, if it exists
                                for (var index = 0; index < assessorChildren.length; index++) {
                                    if (assessorChildren[index].field && assessorChildren[index].field === 'validation') {
                                        var assessorQc = assessorChildren[index].items[0].data_fields;
                                    }
                                }
                                row += '<td class="workflowEntry">';
                                row += '<p>FreeSurfer: <a href="/data/archive/experiments/' + sessionMeta.id + '/assessors/' + assessorData.id + '?format=html">' + assessorData.date + '</a></p>';
                                if (assessorQc) {
                                    row += '<p>QC: '+ assessorQc.status + '(' + assessorQc.date + ')</p>';
                                } else {
                                    row += '<p>Needs QC</p>';
                                }
                                row += '</td>';
                                row += '<td class="workflowEntry"><p>?</p></td>';
                                row += '</tr>';
                                jq(workflowTable).append(row);
                            } else

                            {
                                row += '<td colspan="2"></td>';
                                row += '</tr>';
                                jq(workflowTable).append(row);
                            }
                        }
                    } else {
                        row += '<td colspan="2"></td>';
                        row += '</tr>';
                        jq(workflowTable).append(row);
                    }

                });


            }
        };

        var queryWorkflow = function(){
            $.getJSON('/data/search/saved/'+searchId+'/results?format=json')
                .success(function(data){
                    results = data.ResultSet.Result;
                    if ((results.length > 0) && (projectId)) {
                        displayProjectWorkflow();
                    } else
                    if (results.length > 0) {
                        displayAllWorkflow();
                    } else {
                        $(workflowTable).append('<tr><td colspan="6"><p>No active patients found</p></td></tr>');
                    }
                })
                .fail(function(){
                    $(workflowTable).append('<tr><td colspan="6"><p>An error occurred.</p></td></tr>');
                });
        }

        queryWorkflow();
    }
})();




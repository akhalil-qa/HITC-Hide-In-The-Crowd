var mcl;

$(document).ready(function() {
  mcl.init();
});

var HVElibrary = {
  /* setup HVE */
  // L: max number of friends
  // seed: seed for PRNG
  hve_setup: function (L, seed) {
    var i;

    var publicKey = new Object();
  	publicKey.V = new mcl.G2();
    publicKey.g = new mcl.G1();
    publicKey.f = new mcl.G2();
  	publicKey.Y = new mcl.GT();
    publicKey.H = new Array(L);
    for (i = 0; i < L; i++)
    	publicKey.H[i] = new mcl.G2();

    var masterKey = new mcl.G2();

    var r = new mcl.Fr();

    r.setByCSPRNGWithSeed(seed);

    publicKey.g = mcl.hashAndMapToG1(r.getStr());
    r.setByCSPRNGWithSeed(r.getStr());
    masterKey = mcl.hashAndMapToG2(r.getStr());
    r.setByCSPRNGWithSeed(r.getStr());
    publicKey.f = mcl.hashAndMapToG2(r.getStr());
    publicKey.Y = mcl.pairing(publicKey.g, masterKey);
    for (i = 0; i < L; i++) {
    	r.setByCSPRNGWithSeed(r.getStr());
    	publicKey.H[i] = mcl.hashAndMapToG2(r.getStr());
    }
    r.setByCSPRNGWithSeed(r.getStr());
    publicKey.V = mcl.hashAndMapToG2(r.getStr());

    // convert to hex
    publicKey.V = publicKey.V.serializeToHexStr();
    publicKey.g = publicKey.g.serializeToHexStr();
    publicKey.f = publicKey.f.serializeToHexStr();
    publicKey.Y = publicKey.Y.serializeToHexStr();
    for (i = 0; i < L; i++)
      publicKey.H[i] = publicKey.H[i].serializeToHexStr();
    masterKey = masterKey.serializeToHexStr();

    return [masterKey, publicKey];
  },

  /* generate HVE decryption key */
  // masterKey: HVE master secret key
  // publicKey: HVE public key
  // z: access vector for user
  // L: max number of friends
  // N: max number of wildcards allowed
  hve_generate_decryption_key: function (masterKey, publicKey, z, L, N) {
    var i, j;

    // convert to objects
    publicKey.V = mcl.deserializeHexStrToG2(publicKey.V);
    publicKey.g = mcl.deserializeHexStrToG1(publicKey.g);
    publicKey.f = mcl.deserializeHexStrToG2(publicKey.f);
    publicKey.Y = mcl.deserializeHexStrToGT(publicKey.Y);
    for (i = 0; i < L; i++)
      publicKey.H[i] = mcl.deserializeHexStrToG2(publicKey.H[i]);
    masterKey = mcl.deserializeHexStrToG2(masterKey);


    var decryptionKey = new Object();
    decryptionKey.K1 = new mcl.G1();
    decryptionKey.K2 = new mcl.G1();
    decryptionKey.K3 = new Array(N+1);
    for (i = 0; i < N+1; i++)
    	decryptionKey.K3[i] = new mcl.G2();

    var r = new mcl.Fr();
  	var r1 = new mcl.Fr();
    var x = new mcl.Fr();
    var aux = new mcl.G2();

    r.setByCSPRNG();
    r1.setByCSPRNG();
    decryptionKey.K1 = mcl.mul(publicKey.g, r);
    decryptionKey.K2 = mcl.mul(publicKey.g, r1);
    for (j = 0; j <= N; j++) {
    	decryptionKey.K3[j].clear();
    }
    for (i = 0; i < L; i++) {
    	if (z[i] == 0) {
    		aux = publicKey.V;
    	}
    	else {
    		aux = mcl.add(publicKey.V, publicKey.H[i]);
    	}
  		x.setInt(i+1);
    	for (j = 0; j <= N; j++)
    	{
    		decryptionKey.K3[j] = mcl.add(decryptionKey.K3[j], aux);
    		aux = mcl.mul(aux, x);
    	}
    }
    for (j = 0; j <= N; j++) {
    	decryptionKey.K3[j] = mcl.mul(decryptionKey.K3[j], r);
    }
    decryptionKey.K3[0] = mcl.add(decryptionKey.K3[0], masterKey);
    aux = mcl.mul(publicKey.f, r1);
    decryptionKey.K3[0] = mcl.add(decryptionKey.K3[0], aux);

    // convert to hex
    publicKey.V = publicKey.V.serializeToHexStr();
    publicKey.g = publicKey.g.serializeToHexStr();
    publicKey.f = publicKey.f.serializeToHexStr();
    publicKey.Y = publicKey.Y.serializeToHexStr();
    for (i = 0; i < L; i++)
      publicKey.H[i] = publicKey.H[i].serializeToHexStr();
    masterKey = masterKey.serializeToHexStr();
    decryptionKey.K1 = decryptionKey.K1.serializeToHexStr();
    decryptionKey.K2 = decryptionKey.K2.serializeToHexStr();
    for (i = 0; i < N+1; i++)
      decryptionKey.K3[i] = decryptionKey.K3[i].serializeToHexStr();

    return decryptionKey;
  },

  /* HVE encryption */
  // publicKey: HVE public key
  // J: encryption vector - array of user ids that are allowed to decrypt
  // L: max number of friends
  // N: max number of wildcards allowed
  // returns the symmetric key M that is encrypted
  hve_encrypt: function (publicKey, J, L, N) {

    // convert to objects
    publicKey.V = mcl.deserializeHexStrToG2(publicKey.V);
    publicKey.g = mcl.deserializeHexStrToG1(publicKey.g);
    publicKey.f = mcl.deserializeHexStrToG2(publicKey.f);
    publicKey.Y = mcl.deserializeHexStrToGT(publicKey.Y);
    for (i = 0; i < L; i++)
      publicKey.H[i] = mcl.deserializeHexStrToG2(publicKey.H[i]);

    if (J.length > N) {
    	console.log("You can only submit up to " + N + " wildcards");
    	return;
    }

    var i, k;
    var v = new Array(L).fill(0);

    var ciphertext = new Object();
    ciphertext.C0 = new mcl.GT();
    ciphertext.C1 = new mcl.G1();
    ciphertext.C2 = new mcl.G2();
    ciphertext.C3 = new mcl.G2();

    var r = new mcl.Fr();
  	var r1 = new mcl.Fr();
    var x = new mcl.Fr();
  	var s = new mcl.Fr();
    var t = new mcl.Fr(); // t is a[0]
  	var aux = new mcl.G2();
    var aux1 = new mcl.G1();
  	var aux2 = new mcl.G2();
    var M = new mcl.GT();

    t.setInt(1);
    for (i = 0; i < J.length; i++)
    {
  		v[J[i]-1] = 2;
    	r.setInt(J[i]);
    	t = mcl.mul(t, r);
    }
    if (J.length % 2 != 0)
    	t = mcl.neg(t);


    s.setByCSPRNG();
    ciphertext.C0 = mcl.pow(publicKey.Y, s);
    r.setByCSPRNG();
    aux1 = mcl.hashAndMapToG1(r.getStr());
    r.setByCSPRNG();
    aux2 = mcl.hashAndMapToG2(r.getStr());
  	M = mcl.pairing(aux1, aux2);
    ciphertext.C0 = mcl.mul(ciphertext.C0, M);
  	r = mcl.div(s, t);
    ciphertext.C1 = mcl.mul(publicKey.g, r);
  	ciphertext.C2 = mcl.mul(publicKey.f, s);
    ciphertext.C3.clear();
    for (i = 0; i < L; i++) {
  		x.setInt(1);
    	for (k = 0; k < J.length; k++) {
    		r1.setInt(i+1-J[k]);
    		x = mcl.mul(x, r1);
    	}
    	if (v[i] == 0) {
  			aux = publicKey.V;
    	}
    	else if (v[i] == 1) {
    		aux = mcl.add(publicKey.V, publicKey.H[i]);
  		}
    	else {
    		aux = mcl.add(publicKey.V, publicKey.H[i]);
    		aux = mcl.add(aux, publicKey.H[i]);
  		}
    	aux = mcl.mul(aux, x);
    	ciphertext.C3 = mcl.add(ciphertext.C3, aux);
    }
    ciphertext.C3 = mcl.mul(ciphertext.C3, r);

    // convert to hex
    publicKey.V = publicKey.V.serializeToHexStr();
    publicKey.g = publicKey.g.serializeToHexStr();
    publicKey.f = publicKey.f.serializeToHexStr();
    publicKey.Y = publicKey.Y.serializeToHexStr();
    for (i = 0; i < L; i++)
      publicKey.H[i] = publicKey.H[i].serializeToHexStr();
    ciphertext.C0 = ciphertext.C0.serializeToHexStr();
    ciphertext.C1 = ciphertext.C1.serializeToHexStr();
    ciphertext.C2 = ciphertext.C2.serializeToHexStr();
    ciphertext.C3 = ciphertext.C3.serializeToHexStr();
    M = M.serializeToHexStr();

    return [M, ciphertext];
  },

  /* HVE decryption */
  hve_decrypt: function (decryptionKey, ciphertext, J, N) {

    // convert to objects
    decryptionKey.K1 = mcl.deserializeHexStrToG1(decryptionKey.K1);
    decryptionKey.K2 = mcl.deserializeHexStrToG1(decryptionKey.K2);
    for (i = 0; i < N+1; i++)
      decryptionKey.K3[i] = mcl.deserializeHexStrToG2(decryptionKey.K3[i]);
    ciphertext.C0 = mcl.deserializeHexStrToGT(ciphertext.C0);
    ciphertext.C1 = mcl.deserializeHexStrToG1(ciphertext.C1);
    ciphertext.C2 = mcl.deserializeHexStrToG2(ciphertext.C2);
    ciphertext.C3 = mcl.deserializeHexStrToG2(ciphertext.C3);


    var i, j, k, m, tau = J.length, sign = 0;
    var obj = new Object();
    obj.x = 0;
    obj.y = 0;
    obj.t = 0;
    var b;
    var p;

    var x = new mcl.Fr();
    var r = new mcl.Fr();
    var aux = new mcl.G2();
    var aux2 = new mcl.G2();
    var e1 = new mcl.GT();
    var e2 = new mcl.GT();
    var e3 = new mcl.GT();


    var a = new Array(tau+1);
    for (i = 0; i < (tau+1); i++) {
    	a[i] = new mcl.Fr();
    }
    a[tau].setInt(1);
    p = new Array(tau+2);
    b = new Array(tau);
    for (i = 1; i <= tau; i++) {
    	inittwiddle(i, tau, p);
    	for(j = 0; j != tau-i; j++)
    		b[j] = 0;
    	while(j != tau) {
    		b[j++] = 1;
  		}
    	a[tau-i].setInt(0);
    	x.setInt(1);
  		for (j = 0; j < tau; j++) {
    		if (b[j] == 1) {
    			r.setInt(J[j]);
    			x = mcl.mul(x, r);
    		}
    	}
    	a[tau-i] = mcl.add(a[tau-i], x);
  		while(!twiddle(obj, p)) {
    		b[obj.x] = 1;
    		b[obj.y] = 0;
    		x.setInt(1);
    		for (j = 0; j < tau; j++) {
    			if (b[j] == 1) {
    				r.setInt(J[j]);
  					x = mcl.mul(x, r);
    			}
    		}
    		a[tau-i] = mcl.add(a[tau-i], x);
    	}
    	if (!sign) {
    		a[tau-i] = mcl.neg(a[tau-i]);
    		sign = 1;
    	}
    	else {
    		sign = 0;
    	}
    }

    e1 = mcl.pairing(decryptionKey.K1, ciphertext.C3);
  	e2 = mcl.pairing(decryptionKey.K2, ciphertext.C2);
    aux.clear();
  	for (k = 0; k <= tau; k++) {
    	aux2 = mcl.mul(decryptionKey.K3[k], a[k]);
    	aux = mcl.add(aux, aux2);
  	}
    e3 = mcl.pairing(ciphertext.C1, aux);
    e1 = mcl.mul(e1, e2);
  	e1 = mcl.mul(e1, ciphertext.C0);
    e1 = mcl.div(e1, e3);

    // convert to hex
    decryptionKey.K1 = decryptionKey.K1.serializeToHexStr();
    decryptionKey.K2 = decryptionKey.K2.serializeToHexStr();
    for (i = 0; i < N+1; i++)
      decryptionKey.K3[i] = decryptionKey.K3[i].serializeToHexStr();
    ciphertext.C0 = ciphertext.C0.serializeToHexStr();
    ciphertext.C1 = ciphertext.C1.serializeToHexStr();
    ciphertext.C2 = ciphertext.C2.serializeToHexStr();
    ciphertext.C3 = ciphertext.C3.serializeToHexStr();
    e1 = e1.serializeToHexStr();

    return e1;
  }
}

  /* the following two functions generate all combinations of M elements drawn without replacement
    from a set of N elements. Coded by Matthew Belmonte <mkb4@Cornell.edu>, 23 March 1996. */
  function inittwiddle(m, n, p) {
  	var i;
  	p[0] = n+1;
  	for(i = 1; i != n-m+1; i++)
  		p[i] = 0;
  	while(i != n+1) {
  		p[i] = i+m-n;
  		i++;
  	}
  	p[n+1] = -2;
  	if(m == 0)
  		p[1] = 1;
  }

  function twiddle(obj, p) {
  	var i, j, k;
  	j = 1;
  	while(p[j] <= 0)
  		j++;
  	if(p[j-1] == 0) {
  		for(i = j-1; i != 1; i--)
  			p[i] = -1;
  		p[j] = 0;
  		obj.x = obj.t = 0;
  		p[1] = 1;
  		obj.y = j-1;
  	}
  	else {
  		if(j > 1)
  			p[j-1] = 0;
  		do
  			j++;
  		while(p[j] > 0);
  		k = j-1;
  		i = j;
  		while(p[i] == 0)
  			p[i++] = -1;
  		if(p[i] == -1) {
  			p[i] = p[k];
  			obj.t = p[k]-1;
  			obj.x = i-1;
  			obj.y = k-1;
  			p[k] = -1;
  		}
  		else {
  			if(i == p[0])
  				return (1);
  			else {
  				p[j] = p[i];
  				obj.t = p[i]-1;
  				p[i] = 0;
  				obj.x = j-1;
  				obj.y = i-1;
  			}
  		}
  	}
  	return (0);
  }

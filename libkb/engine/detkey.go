package engine

import (
	"bytes"
	"encoding/hex"

	"github.com/agl/ed25519"
	"github.com/keybase/go/libkb"
	"golang.org/x/crypto/nacl/box"
)

type DetKeyEngine struct {
	me         *libkb.User
	signingKey libkb.GenericKey
	lks        *libkb.LKSec
	logui      libkb.LogUI
}

func NewDetKeyEngine(me *libkb.User, signingKey libkb.GenericKey, logui libkb.LogUI) *DetKeyEngine {
	return &DetKeyEngine{me: me, signingKey: signingKey, logui: logui}
}

// Run runs the detkey engine.
func (d *DetKeyEngine) Run(tpk *libkb.TSPassKey) error {
	d.lks = libkb.NewLKSecClientHalf(tpk.LksClientHalf())
	return d.run(tpk)
}

// RunWithLKSLoaded runs the detkey engine with the local key
// security secret key known in advance.  This saves an API
// call to get the server half.  For example, during
// the signup process, the secret key is known, so it uses this
// Run function.
func (d *DetKeyEngine) RunWithLKSLoaded(tpk *libkb.TSPassKey, lksKey []byte) error {
	d.lks = libkb.NewLKSecSecret(lksKey)
	return d.run(tpk)
}

func (d *DetKeyEngine) run(tpk *libkb.TSPassKey) error {
	if err := d.eddsa(tpk.EdDSASeed()); err != nil {
		return err
	}
	if err := d.dh(tpk.DHSeed()); err != nil {
		return err
	}
	return nil
}

func (d *DetKeyEngine) eddsa(seed []byte) error {
	xseed, serverHalf, err := d.serverSeed(seed)
	if err != nil {
		return err
	}
	pub, priv, err := ed25519.GenerateKey(bytes.NewBuffer(xseed))
	if err != nil {
		return err
	}

	G.Log.Info("detkey[eddsa] serverHalf: %x", serverHalf)
	G.Log.Info("detkey[eddsa] pub:        %x", *pub)
	G.Log.Info("detkey[eddsa] priv:       %x", *priv)

	var key libkb.NaclSigningKeyPair
	copy(key.Public[:], (*pub)[:])
	key.Private = &libkb.NaclSigningKeyPrivate{}
	copy(key.Private[:], (*priv)[:])

	return d.push(key, serverHalf, libkb.NACL_EDDSA_EXPIRE_IN, libkb.SIBKEY_TYPE)
}

func (d *DetKeyEngine) dh(seed []byte) error {
	xseed, serverHalf, err := d.serverSeed(seed)
	if err != nil {
		return err
	}
	pub, priv, err := box.GenerateKey(bytes.NewBuffer(xseed))
	if err != nil {
		return err
	}

	G.Log.Info("detkey[dh] serverHalf: %x", serverHalf)
	G.Log.Info("detkey[dh] pub:        %x", *pub)
	G.Log.Info("detkey[dh] priv:       %x", *priv)

	var key libkb.NaclDHKeyPair
	copy(key.Public[:], (*pub)[:])
	key.Private = &libkb.NaclDHKeyPrivate{}
	copy(key.Private[:], (*priv)[:])

	return d.push(key, serverHalf, libkb.NACL_DH_EXPIRE_IN, libkb.SUBKEY_TYPE)
}

func (d *DetKeyEngine) serverSeed(seed []byte) (newseed, serverHalf []byte, err error) {
	serverHalf, err = libkb.RandBytes(len(seed))
	if err != nil {
		return
	}
	newseed = make([]byte, len(seed))
	libkb.XORBytes(newseed, seed, serverHalf)
	return newseed, serverHalf, nil
}

func (d *DetKeyEngine) push(key libkb.GenericKey, serverHalf []byte, expire int, typ string) error {
	jw, err := d.me.KeyProof(key, d.signingKey, typ, expire, nil)
	if err != nil {
		return err
	}
	sig, sigid, linkid, err := libkb.SignJson(jw, d.signingKey)
	if err != nil {
		return err
	}

	arg := libkb.PostNewKeyArg{
		Sig:        sig,
		Id:         *sigid,
		Type:       typ,
		PublicKey:  key,
		SigningKey: d.signingKey,
		EldestKey:  d.signingKey,
		ServerHalf: hex.EncodeToString(serverHalf),
	}
	if err := libkb.PostNewKey(arg); err != nil {
		return err
	}

	d.me.SigChainBump(linkid, sigid)

	return nil
}

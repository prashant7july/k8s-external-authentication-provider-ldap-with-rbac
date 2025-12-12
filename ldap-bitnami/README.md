## Add
ldapadd -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=example,dc=org" \
  -w adminpassword \
  -f alice.ldif

### Output (if exist)
adding new entry "ou=dev,dc=example,dc=org"
adding new entry "cn=alice,ou=dev,dc=example,dc=org"

## Search
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=example,dc=org" \
  -w adminpassword \
  -b "dc=example,dc=org" "(cn=alice)"

## Output (If exist)
```sh
# extended LDIF
#
# LDAPv3
# base <dc=example,dc=org> with scope subtree
# filter: (cn=alice)
# requesting: ALL
#

# alice, dev, example.org
dn: cn=alice,ou=dev,dc=example,dc=org
objectClass: inetOrgPerson
cn: alice
sn: Wonderland
givenName: Alice
userPassword:: YWxpY2VwYXNzd29yZA==

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
```
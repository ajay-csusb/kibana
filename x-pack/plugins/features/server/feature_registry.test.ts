/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { FeatureRegistry } from './feature_registry';
import { ElasticsearchFeatureConfig, KibanaFeatureConfig } from '../common';

describe('FeatureRegistry', () => {
  describe('Kibana Features', () => {
    it('allows a minimal feature to be registered', () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: null,
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerKibanaFeature(feature);
      const result = featureRegistry.getAllKibanaFeatures();
      expect(result).toHaveLength(1);

      // Should be the equal, but not the same instance (i.e., a defensive copy)
      expect(result[0].toRaw()).not.toBe(feature);
      expect(result[0].toRaw()).toEqual(feature);
    });

    it('allows a complex feature to be registered', () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        excludeFromBasePrivileges: true,
        icon: 'addDataApp',
        navLinkId: 'someNavLink',
        app: ['app1'],
        validLicenses: ['standard', 'basic', 'gold', 'platinum'],
        catalogue: ['foo'],
        management: {
          foo: ['bar'],
        },
        privileges: {
          all: {
            catalogue: ['foo'],
            management: {
              foo: ['bar'],
            },
            app: ['app1'],
            savedObject: {
              all: ['space', 'etc', 'telemetry'],
              read: ['canvas', 'config', 'url'],
            },
            api: ['someApiEndpointTag', 'anotherEndpointTag'],
            ui: ['allowsFoo', 'showBar', 'showBaz'],
          },
          read: {
            savedObject: {
              all: [],
              read: ['config', 'url'],
            },
            ui: [],
          },
        },
        subFeatures: [
          {
            name: 'sub-feature-1',
            privilegeGroups: [
              {
                groupType: 'independent',
                privileges: [
                  {
                    id: 'foo',
                    name: 'foo',
                    includeIn: 'read',
                    savedObject: {
                      all: [],
                      read: [],
                    },
                    ui: [],
                  },
                ],
              },
              {
                groupType: 'mutually_exclusive',
                privileges: [
                  {
                    id: 'bar',
                    name: 'bar',
                    includeIn: 'all',
                    savedObject: {
                      all: [],
                      read: [],
                    },
                    ui: [],
                  },
                  {
                    id: 'baz',
                    name: 'baz',
                    includeIn: 'none',
                    savedObject: {
                      all: [],
                      read: [],
                    },
                    ui: [],
                  },
                ],
              },
            ],
          },
        ],
        privilegesTooltip: 'some fancy tooltip',
        reserved: {
          privileges: [
            {
              id: 'reserved',
              privilege: {
                catalogue: ['foo'],
                management: {
                  foo: ['bar'],
                },
                app: ['app1'],
                savedObject: {
                  all: ['space', 'etc', 'telemetry'],
                  read: ['canvas', 'config', 'url'],
                },
                api: ['someApiEndpointTag', 'anotherEndpointTag'],
                ui: ['allowsFoo', 'showBar', 'showBaz'],
              },
            },
          ],
          description: 'some completely adequate description',
        },
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerKibanaFeature(feature);
      const result = featureRegistry.getAllKibanaFeatures();
      expect(result).toHaveLength(1);

      // Should be the equal, but not the same instance (i.e., a defensive copy)
      expect(result[0].toRaw()).not.toBe(feature);
      expect(result[0].toRaw()).toEqual(feature);
    });

    it(`requires a value for privileges`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
      } as any;

      const featureRegistry = new FeatureRegistry();
      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"child \\"privileges\\" fails because [\\"privileges\\" is required]"`
      );
    });

    it(`does not allow sub-features to be registered when no primary privileges are not registered`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: null,
        subFeatures: [
          {
            name: 'my sub feature',
            privilegeGroups: [
              {
                groupType: 'independent',
                privileges: [
                  {
                    id: 'my-sub-priv',
                    name: 'my sub priv',
                    includeIn: 'none',
                    savedObject: {
                      all: [],
                      read: [],
                    },
                    ui: [],
                  },
                ],
              },
            ],
          },
        ],
      };

      const featureRegistry = new FeatureRegistry();
      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"child \\"subFeatures\\" fails because [\\"subFeatures\\" must contain less than or equal to 0 items]"`
      );
    });

    it(`automatically grants 'all' access to telemetry saved objects for the 'all' privilege`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: {
          all: {
            ui: [],
            savedObject: {
              all: [],
              read: [],
            },
          },
          read: {
            ui: [],
            savedObject: {
              all: [],
              read: [],
            },
          },
        },
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerKibanaFeature(feature);
      const result = featureRegistry.getAllKibanaFeatures();

      expect(result[0].privileges).toHaveProperty('all');
      expect(result[0].privileges).toHaveProperty('read');

      const allPrivilege = result[0].privileges?.all;
      expect(allPrivilege?.savedObject.all).toEqual(['telemetry']);
    });

    it(`automatically grants 'read' access to config and url saved objects for both privileges`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: {
          all: {
            ui: [],
            savedObject: {
              all: [],
              read: [],
            },
          },
          read: {
            ui: [],
            savedObject: {
              all: [],
              read: [],
            },
          },
        },
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerKibanaFeature(feature);
      const result = featureRegistry.getAllKibanaFeatures();

      expect(result[0].privileges).toHaveProperty('all');
      expect(result[0].privileges).toHaveProperty('read');

      const allPrivilege = result[0].privileges?.all;
      const readPrivilege = result[0].privileges?.read;
      expect(allPrivilege?.savedObject.read).toEqual(['config', 'url']);
      expect(readPrivilege?.savedObject.read).toEqual(['config', 'url']);
    });

    it(`automatically grants 'all' access to telemetry and 'read' to [config, url] saved objects for the reserved privilege`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: null,
        reserved: {
          description: 'foo',
          privileges: [
            {
              id: 'reserved',
              privilege: {
                ui: [],
                savedObject: {
                  all: [],
                  read: [],
                },
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerKibanaFeature(feature);
      const result = featureRegistry.getAllKibanaFeatures();

      const reservedPrivilege = result[0]!.reserved!.privileges[0].privilege;
      expect(reservedPrivilege.savedObject.all).toEqual(['telemetry']);
      expect(reservedPrivilege.savedObject.read).toEqual(['config', 'url']);
    });

    it(`does not duplicate the automatic grants if specified on the incoming feature`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: {
          all: {
            ui: [],
            savedObject: {
              all: ['telemetry'],
              read: ['config', 'url'],
            },
          },
          read: {
            ui: [],
            savedObject: {
              all: [],
              read: ['config', 'url'],
            },
          },
        },
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerKibanaFeature(feature);
      const result = featureRegistry.getAllKibanaFeatures();

      expect(result[0].privileges).toHaveProperty('all');
      expect(result[0].privileges).toHaveProperty('read');

      const allPrivilege = result[0].privileges!.all;
      const readPrivilege = result[0].privileges!.read;
      expect(allPrivilege?.savedObject.all).toEqual(['telemetry']);
      expect(allPrivilege?.savedObject.read).toEqual(['config', 'url']);
      expect(readPrivilege?.savedObject.read).toEqual(['config', 'url']);
    });

    it(`does not allow duplicate features to be registered`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: null,
      };

      const duplicateFeature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Duplicate Test Feature',
        app: [],
        privileges: null,
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerKibanaFeature(feature);

      expect(() =>
        featureRegistry.registerKibanaFeature(duplicateFeature)
      ).toThrowErrorMatchingInlineSnapshot(`"Feature with id test-feature is already registered."`);
    });

    ['contains space', 'contains_invalid()_chars', ''].forEach((prohibitedChars) => {
      it(`prevents features from being registered with a navLinkId of "${prohibitedChars}"`, () => {
        const featureRegistry = new FeatureRegistry();
        expect(() =>
          featureRegistry.registerKibanaFeature({
            id: 'foo',
            name: 'some feature',
            navLinkId: prohibitedChars,
            app: [],
            privileges: null,
          })
        ).toThrowErrorMatchingSnapshot();
      });

      it(`prevents features from being registered with a management id of "${prohibitedChars}"`, () => {
        const featureRegistry = new FeatureRegistry();
        expect(() =>
          featureRegistry.registerKibanaFeature({
            id: 'foo',
            name: 'some feature',
            management: {
              kibana: [prohibitedChars],
            },
            app: [],
            privileges: null,
          })
        ).toThrowErrorMatchingSnapshot();
      });

      it(`prevents features from being registered with a catalogue entry of "${prohibitedChars}"`, () => {
        const featureRegistry = new FeatureRegistry();
        expect(() =>
          featureRegistry.registerKibanaFeature({
            id: 'foo',
            name: 'some feature',
            catalogue: [prohibitedChars],
            app: [],
            privileges: null,
          })
        ).toThrowErrorMatchingSnapshot();
      });
    });

    ['catalogue', 'management', 'navLinks', `doesn't match valid regex`].forEach((prohibitedId) => {
      it(`prevents features from being registered with an ID of "${prohibitedId}"`, () => {
        const featureRegistry = new FeatureRegistry();
        expect(() =>
          featureRegistry.registerKibanaFeature({
            id: prohibitedId,
            name: 'some feature',
            app: [],
            privileges: null,
          })
        ).toThrowErrorMatchingSnapshot();
      });
    });

    it('prevents features from being registered with invalid privilege names', () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: ['app1', 'app2'],
        privileges: {
          foo: {
            name: 'Foo',
            app: ['app1', 'app2'],
            savedObject: {
              all: ['config', 'space', 'etc'],
              read: ['canvas'],
            },
            api: ['someApiEndpointTag', 'anotherEndpointTag'],
            ui: ['allowsFoo', 'showBar', 'showBaz'],
          },
        } as any,
      };

      const featureRegistry = new FeatureRegistry();
      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"child \\"privileges\\" fails because [\\"foo\\" is not allowed]"`
      );
    });

    it(`prevents privileges from specifying app entries that don't exist at the root level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: ['bar'],
        privileges: {
          all: {
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: ['foo', 'bar', 'baz'],
          },
          read: {
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: ['foo', 'bar', 'baz'],
          },
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature privilege test-feature.all has unknown app entries: foo, baz"`
      );
    });

    it(`prevents features from specifying app entries that don't exist at the privilege level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: ['foo', 'bar', 'baz'],
        privileges: {
          all: {
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: ['bar'],
          },
          read: {
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
        },
        subFeatures: [
          {
            name: 'my sub feature',
            privilegeGroups: [
              {
                groupType: 'independent',
                privileges: [
                  {
                    id: 'cool-sub-feature-privilege',
                    name: 'cool privilege',
                    includeIn: 'none',
                    savedObject: {
                      all: [],
                      read: [],
                    },
                    ui: [],
                    app: ['foo'],
                  },
                ],
              },
            ],
          },
        ],
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature test-feature specifies app entries which are not granted to any privileges: baz"`
      );
    });

    it(`prevents reserved privileges from specifying app entries that don't exist at the root level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: ['bar'],
        privileges: null,
        reserved: {
          description: 'something',
          privileges: [
            {
              id: 'reserved',
              privilege: {
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: ['foo', 'bar', 'baz'],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature privilege test-feature.reserved has unknown app entries: foo, baz"`
      );
    });

    it(`prevents features from specifying app entries that don't exist at the reserved privilege level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: ['foo', 'bar', 'baz'],
        privileges: null,
        reserved: {
          description: 'something',
          privileges: [
            {
              id: 'reserved',
              privilege: {
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: ['foo', 'bar'],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature test-feature specifies app entries which are not granted to any privileges: baz"`
      );
    });

    it(`prevents privileges from specifying catalogue entries that don't exist at the root level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        catalogue: ['bar'],
        privileges: {
          all: {
            catalogue: ['foo', 'bar', 'baz'],
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
          read: {
            catalogue: ['foo', 'bar', 'baz'],
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature privilege test-feature.all has unknown catalogue entries: foo, baz"`
      );
    });

    it(`prevents features from specifying catalogue entries that don't exist at the privilege level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        catalogue: ['foo', 'bar', 'baz'],
        privileges: {
          all: {
            catalogue: ['foo'],
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
          read: {
            catalogue: ['foo'],
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
        },
        subFeatures: [
          {
            name: 'my sub feature',
            privilegeGroups: [
              {
                groupType: 'independent',
                privileges: [
                  {
                    id: 'cool-sub-feature-privilege',
                    name: 'cool privilege',
                    includeIn: 'none',
                    savedObject: {
                      all: [],
                      read: [],
                    },
                    ui: [],
                    catalogue: ['bar'],
                  },
                ],
              },
            ],
          },
        ],
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature test-feature specifies catalogue entries which are not granted to any privileges: baz"`
      );
    });

    it(`prevents reserved privileges from specifying catalogue entries that don't exist at the root level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        catalogue: ['bar'],
        privileges: null,
        reserved: {
          description: 'something',
          privileges: [
            {
              id: 'reserved',
              privilege: {
                catalogue: ['foo', 'bar', 'baz'],
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: [],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature privilege test-feature.reserved has unknown catalogue entries: foo, baz"`
      );
    });

    it(`prevents features from specifying catalogue entries that don't exist at the reserved privilege level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        catalogue: ['foo', 'bar', 'baz'],
        privileges: null,
        reserved: {
          description: 'something',
          privileges: [
            {
              id: 'reserved',
              privilege: {
                catalogue: ['foo', 'bar'],
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: [],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature test-feature specifies catalogue entries which are not granted to any privileges: baz"`
      );
    });

    it(`prevents privileges from specifying alerting entries that don't exist at the root level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        alerting: ['bar'],
        privileges: {
          all: {
            alerting: {
              all: ['foo', 'bar'],
              read: ['baz'],
            },
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
          read: {
            alerting: { read: ['foo', 'bar', 'baz'] },
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature privilege test-feature.all has unknown alerting entries: foo, baz"`
      );
    });

    it(`prevents features from specifying alerting entries that don't exist at the privilege level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        alerting: ['foo', 'bar', 'baz'],
        privileges: {
          all: {
            alerting: { all: ['foo'] },
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
          read: {
            alerting: { all: ['foo'] },
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
        },
        subFeatures: [
          {
            name: 'my sub feature',
            privilegeGroups: [
              {
                groupType: 'independent',
                privileges: [
                  {
                    id: 'cool-sub-feature-privilege',
                    name: 'cool privilege',
                    includeIn: 'none',
                    savedObject: {
                      all: [],
                      read: [],
                    },
                    ui: [],
                    alerting: { all: ['bar'] },
                  },
                ],
              },
            ],
          },
        ],
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature test-feature specifies alerting entries which are not granted to any privileges: baz"`
      );
    });

    it(`prevents reserved privileges from specifying alerting entries that don't exist at the root level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        alerting: ['bar'],
        privileges: null,
        reserved: {
          description: 'something',
          privileges: [
            {
              id: 'reserved',
              privilege: {
                alerting: { all: ['foo', 'bar', 'baz'] },
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: [],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature privilege test-feature.reserved has unknown alerting entries: foo, baz"`
      );
    });

    it(`prevents features from specifying alerting entries that don't exist at the reserved privilege level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        alerting: ['foo', 'bar', 'baz'],
        privileges: null,
        reserved: {
          description: 'something',
          privileges: [
            {
              id: 'reserved',
              privilege: {
                alerting: { all: ['foo', 'bar'] },
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: [],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature test-feature specifies alerting entries which are not granted to any privileges: baz"`
      );
    });

    it(`prevents privileges from specifying management sections that don't exist at the root level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        catalogue: ['bar'],
        management: {
          kibana: ['hey'],
        },
        privileges: {
          all: {
            catalogue: ['bar'],
            management: {
              elasticsearch: ['hey'],
            },
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
          read: {
            catalogue: ['bar'],
            management: {
              elasticsearch: ['hey'],
            },
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature privilege test-feature.all has unknown management section: elasticsearch"`
      );
    });

    it(`prevents features from specifying management sections that don't exist at the privilege level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        catalogue: ['bar'],
        management: {
          kibana: ['hey'],
          elasticsearch: ['hey', 'there'],
        },
        privileges: {
          all: {
            catalogue: ['bar'],
            management: {
              elasticsearch: ['hey'],
            },
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
          read: {
            catalogue: ['bar'],
            management: {
              elasticsearch: ['hey'],
            },
            savedObject: {
              all: [],
              read: [],
            },
            ui: [],
            app: [],
          },
        },
        subFeatures: [
          {
            name: 'my sub feature',
            privilegeGroups: [
              {
                groupType: 'independent',
                privileges: [
                  {
                    id: 'cool-sub-feature-privilege',
                    name: 'cool privilege',
                    includeIn: 'none',
                    savedObject: {
                      all: [],
                      read: [],
                    },
                    ui: [],
                    management: {
                      kibana: ['hey'],
                      elasticsearch: ['hey'],
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature test-feature specifies management entries which are not granted to any privileges: elasticsearch.there"`
      );
    });

    it(`prevents reserved privileges from specifying management entries that don't exist at the root level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        catalogue: ['bar'],
        management: {
          kibana: ['hey'],
        },
        privileges: null,
        reserved: {
          description: 'something',
          privileges: [
            {
              id: 'reserved',
              privilege: {
                catalogue: ['bar'],
                management: {
                  kibana: ['hey-there'],
                },
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: [],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature privilege test-feature.reserved has unknown management entries for section kibana: hey-there"`
      );
    });

    it(`prevents features from specifying management entries that don't exist at the reserved privilege level`, () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        catalogue: ['bar'],
        management: {
          kibana: ['hey', 'hey-there'],
        },
        privileges: null,
        reserved: {
          description: 'something',
          privileges: [
            {
              id: 'reserved',
              privilege: {
                catalogue: ['bar'],
                management: {
                  kibana: ['hey-there'],
                },
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: [],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();

      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature test-feature specifies management entries which are not granted to any privileges: kibana.hey"`
      );
    });

    it('allows multiple reserved feature privileges to be registered', () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: null,
        reserved: {
          description: 'my reserved privileges',
          privileges: [
            {
              id: 'a_reserved_1',
              privilege: {
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: [],
              },
            },
            {
              id: 'a_reserved_2',
              privilege: {
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: [],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerKibanaFeature(feature);
      const result = featureRegistry.getAllKibanaFeatures();
      expect(result).toHaveLength(1);
      expect(result[0].reserved?.privileges).toHaveLength(2);
    });

    it('does not allow reserved privilege ids to start with "reserved_"', () => {
      const feature: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: null,
        reserved: {
          description: 'my reserved privileges',
          privileges: [
            {
              id: 'reserved_1',
              privilege: {
                savedObject: {
                  all: [],
                  read: [],
                },
                ui: [],
                app: [],
              },
            },
          ],
        },
      };

      const featureRegistry = new FeatureRegistry();
      expect(() =>
        featureRegistry.registerKibanaFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"child \\"reserved\\" fails because [child \\"privileges\\" fails because [\\"privileges\\" at position 0 fails because [child \\"id\\" fails because [\\"id\\" with value \\"reserved_1\\" fails to match the required pattern: /^(?!reserved_)[a-zA-Z0-9_-]+$/]]]]"`
      );
    });

    it('cannot register feature after getAll has been called', () => {
      const feature1: KibanaFeatureConfig = {
        id: 'test-feature',
        name: 'Test Feature',
        app: [],
        privileges: null,
      };
      const feature2: KibanaFeatureConfig = {
        id: 'test-feature-2',
        name: 'Test Feature 2',
        app: [],
        privileges: null,
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerKibanaFeature(feature1);
      featureRegistry.getAllKibanaFeatures();
      expect(() => {
        featureRegistry.registerKibanaFeature(feature2);
      }).toThrowErrorMatchingInlineSnapshot(
        `"Features are locked, can't register new features. Attempt to register test-feature-2 failed."`
      );
    });
  });

  describe('Elasticsearch Features', () => {
    it('allows a minimal feature to be registered', () => {
      const feature: ElasticsearchFeatureConfig = {
        id: 'test-feature',
        privileges: [
          {
            requiredClusterPrivileges: ['all'],
            ui: [],
          },
        ],
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerElasticsearchFeature(feature);
      const result = featureRegistry.getAllElasticsearchFeatures();
      expect(result).toHaveLength(1);

      // Should be the equal, but not the same instance (i.e., a defensive copy)
      expect(result[0].toRaw()).not.toBe(feature);
      expect(result[0].toRaw()).toEqual(feature);
    });

    it('allows a complex feature to ge registered', () => {
      const feature: ElasticsearchFeatureConfig = {
        id: 'test-feature',
        management: {
          kibana: ['foo'],
          data: ['bar'],
        },
        catalogue: ['foo', 'bar'],
        privileges: [
          {
            requiredClusterPrivileges: ['monitor', 'manage'],
            requiredIndexPrivileges: {
              foo: ['read'],
              bar: ['all'],
              baz: ['view_index_metadata'],
            },
            ui: ['ui_a'],
          },
          {
            requiredClusterPrivileges: [],
            requiredRoles: ['some_role'],
            ui: ['ui_b'],
          },
        ],
      };

      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerElasticsearchFeature(feature);
      const result = featureRegistry.getAllElasticsearchFeatures();
      expect(result).toHaveLength(1);

      // Should be the equal, but not the same instance (i.e., a defensive copy)
      expect(result[0].toRaw()).not.toBe(feature);
      expect(result[0].toRaw()).toEqual(feature);
    });

    it('requires a value for privileges', () => {
      const feature: ElasticsearchFeatureConfig = {
        id: 'test-feature',
      } as any;
      const featureRegistry = new FeatureRegistry();
      expect(() =>
        featureRegistry.registerElasticsearchFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"child \\"privileges\\" fails because [\\"privileges\\" is required]"`
      );
    });

    it('requires privileges to declare some form of required es privileges', () => {
      const feature: ElasticsearchFeatureConfig = {
        id: 'test-feature',
        privileges: [
          {
            ui: [],
          },
        ],
      } as any;
      const featureRegistry = new FeatureRegistry();
      expect(() =>
        featureRegistry.registerElasticsearchFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Feature test-feature has a privilege definition at index 0 without any privileges defined."`
      );
    });

    it('does not allow duplicate privilege ids', () => {
      const feature: ElasticsearchFeatureConfig = {
        id: 'test-feature',
        privileges: [
          {
            requiredClusterPrivileges: ['all'],
            ui: [],
          },
        ],
      };
      const featureRegistry = new FeatureRegistry();
      featureRegistry.registerElasticsearchFeature(feature);
      expect(() =>
        featureRegistry.registerElasticsearchFeature(feature)
      ).toThrowErrorMatchingInlineSnapshot(`"Feature with id test-feature is already registered."`);
    });
  });

  it('does not allow a Kibana feature to share an id with an Elasticsearch feature', () => {
    const kibanaFeature: KibanaFeatureConfig = {
      id: 'test-feature',
      name: 'Test Feature',
      app: [],
      privileges: null,
    };

    const elasticsearchFeature: ElasticsearchFeatureConfig = {
      id: 'test-feature',
      privileges: [
        {
          requiredClusterPrivileges: ['all'],
          ui: [],
        },
      ],
    };

    const featureRegistry = new FeatureRegistry();
    featureRegistry.registerElasticsearchFeature(elasticsearchFeature);
    expect(() =>
      featureRegistry.registerKibanaFeature(kibanaFeature)
    ).toThrowErrorMatchingInlineSnapshot(`"Feature with id test-feature is already registered."`);
  });

  it('does not allow an Elasticsearch feature to share an id with a Kibana feature', () => {
    const kibanaFeature: KibanaFeatureConfig = {
      id: 'test-feature',
      name: 'Test Feature',
      app: [],
      privileges: null,
    };

    const elasticsearchFeature: ElasticsearchFeatureConfig = {
      id: 'test-feature',
      privileges: [
        {
          requiredClusterPrivileges: ['all'],
          ui: [],
        },
      ],
    };

    const featureRegistry = new FeatureRegistry();
    featureRegistry.registerKibanaFeature(kibanaFeature);
    expect(() =>
      featureRegistry.registerElasticsearchFeature(elasticsearchFeature)
    ).toThrowErrorMatchingInlineSnapshot(`"Feature with id test-feature is already registered."`);
  });
});
